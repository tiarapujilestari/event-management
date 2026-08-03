import { Request, Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/db";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { generateReferralCode, generateCouponCode } from "../utils/generators";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendMail } from "../utils/mailer";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const REFRESH_COOKIE = "refreshToken";

const isCrossSite = process.env.CROSS_SITE_COOKIES === "true";

function setRefreshCookie(res: Response, token: string, rememberMe = false) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isCrossSite || process.env.NODE_ENV === "production",
    sameSite: isCrossSite ? "none" : "lax",
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, role, referralCode } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("Email is already registered");

  let referrer = null;
  if (referralCode) {
    referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer) throw ApiError.badRequest("Invalid referral code");
  }

  const hashed = await hashPassword(password);
  const newReferralCode = generateReferralCode(fullName);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName,
        email,
        password: hashed,
        role: role || "CUSTOMER",
        referralCode: newReferralCode,
        referredById: referrer?.id,
        verificationToken,
        profile: { create: {} },
      },
    });

    // Referral rewards
    if (referrer) {
      // Owner gets 10,000 points, expires in 3 months
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      await tx.referralPoint.create({
        data: { ownerId: referrer.id, points: 10000, expiresAt },
      });
      await tx.pointHistory.create({
        data: {
          userId: referrer.id,
          points: 10000,
          type: "REFERRAL_BONUS",
          note: `Referral bonus from ${email}`,
        },
      });

      // user baru 10% kupon diskon
      await tx.coupon.create({
        data: {
          userId: created.id,
          code: generateCouponCode(),
          discountType: "PERCENTAGE",
          discountValue: 10,
          expiresAt,
        },
      });
    }

    return created;
  });

  await sendMail({
    to: email,
    subject: "Verify your Event Platform account",
    html: `<p>Hi ${fullName},</p><p>Please verify your account using this token: <b>${verificationToken}</b></p>`,
  }).catch(() => null); // don't block registration if email fails

  res.status(201).json({
    success: true,
    message:
      "Registration successful. Please check your email to verify your account.",
    data: { id: user.id, email: user.email, referralCode: user.referralCode },
  });
});

// GET /api/auth/verify-email?token=
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  const user = await prisma.user.findFirst({
    where: { verificationToken: token as string },
  });
  if (!user) throw ApiError.badRequest("Invalid or expired verification token");

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null },
  });

  res.json({ success: true, message: "Email verified successfully" });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload, rememberMe);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  setRefreshCookie(res, refreshToken, rememberMe);

  res.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        isVerified: user.isVerified,
      },
    },
  });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== token)
    throw ApiError.unauthorized("Refresh token revoked");

  const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
  res.json({ success: true, data: { accessToken: newAccessToken } });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { refreshToken: null },
      });
    } catch {}
  }

  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isCrossSite || process.env.NODE_ENV === "production",
    sameSite: isCrossSite ? "none" : "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendMail({
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    }).catch(() => null);

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  },
);

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) throw ApiError.badRequest("Invalid or expired reset token");

    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
        refreshToken: null,
      },
    });

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  },
);

// GET /api/auth/me
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { profile: true },
  });
  if (!user) throw ApiError.notFound("User not found");

  const { password, refreshToken, resetToken, verificationToken, ...safeUser } =
    user;
  res.json({ success: true, data: safeUser });
});

// POST /api/auth/google
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { credential, role, referralCode } = req.body;
  if (!credential) throw ApiError.badRequest("Missing Google credential");
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw ApiError.internal(
      "Google Sign-In is not configured on the server (missing GOOGLE_CLIENT_ID)",
    );
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized("Invalid Google credential");
  }

  if (!payload?.email)
    throw ApiError.unauthorized("Google account has no email");
  if (!payload.email_verified)
    throw ApiError.unauthorized("Google email is not verified");

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    let referrer = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({ where: { referralCode } });
    }

    const randomPassword = await hashPassword(
      crypto.randomBytes(32).toString("hex"),
    );

    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: payload!.name || payload!.email!.split("@")[0],
          email: payload!.email!,
          password: randomPassword,
          role: role === "ORGANIZER" ? "ORGANIZER" : "CUSTOMER",
          isVerified: true,
          referralCode: generateReferralCode(payload!.name || payload!.email!),
          referredById: referrer?.id,
          profile: { create: { avatarUrl: payload!.picture } },
        },
      });

      if (referrer) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);
        await tx.referralPoint.create({
          data: { ownerId: referrer.id, points: 10000, expiresAt },
        });
        await tx.pointHistory.create({
          data: {
            userId: referrer.id,
            points: 10000,
            type: "REFERRAL_BONUS",
            note: `Referral bonus from ${created.email}`,
          },
        });
        await tx.coupon.create({
          data: {
            userId: created.id,
            code: generateCouponCode(),
            discountType: "PERCENTAGE",
            discountValue: 10,
            expiresAt,
          },
        });
      }

      return created;
    });
  }

  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload, true);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  setRefreshCookie(res, refreshToken, true);

  res.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        isVerified: user.isVerified,
      },
    },
  });
});
