"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.me = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.login = exports.verifyEmail = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../config/db");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const generators_1 = require("../utils/generators");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const mailer_1 = require("../utils/mailer");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const REFRESH_COOKIE = "refreshToken";
const isCrossSite = process.env.CROSS_SITE_COOKIES === "true";
function setRefreshCookie(res, token, rememberMe = false) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: isCrossSite || process.env.NODE_ENV === "production",
        sameSite: isCrossSite ? "none" : "lax",
        maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    });
}
// POST /api/auth/register
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { fullName, email, password, role, referralCode } = req.body;
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw ApiError_1.ApiError.conflict("Email is already registered");
    let referrer = null;
    if (referralCode) {
        referrer = await db_1.prisma.user.findUnique({ where: { referralCode } });
        if (!referrer)
            throw ApiError_1.ApiError.badRequest("Invalid referral code");
    }
    const hashed = await (0, hash_1.hashPassword)(password);
    const newReferralCode = (0, generators_1.generateReferralCode)(fullName);
    const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
    const user = await db_1.prisma.$transaction(async (tx) => {
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
                    code: (0, generators_1.generateCouponCode)(),
                    discountType: "PERCENTAGE",
                    discountValue: 10,
                    expiresAt,
                },
            });
        }
        return created;
    });
    await (0, mailer_1.sendMail)({
        to: email,
        subject: "Verify your Event Platform account",
        html: `<p>Hi ${fullName},</p><p>Please verify your account using this token: <b>${verificationToken}</b></p>`,
    }).catch(() => null); // don't block registration if email fails
    res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        data: { id: user.id, email: user.email, referralCode: user.referralCode },
    });
});
// GET /api/auth/verify-email?token=
exports.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.query;
    const user = await db_1.prisma.user.findFirst({
        where: { verificationToken: token },
    });
    if (!user)
        throw ApiError_1.ApiError.badRequest("Invalid or expired verification token");
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationToken: null },
    });
    res.json({ success: true, message: "Email verified successfully" });
});
// POST /api/auth/login
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    const valid = await (0, hash_1.comparePassword)(password, user.password);
    if (!valid)
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    const payload = { userId: user.id, role: user.role };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload, rememberMe);
    await db_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
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
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token)
        throw ApiError_1.ApiError.unauthorized("Refresh token missing");
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw ApiError_1.ApiError.unauthorized("Invalid or expired refresh token");
    }
    const user = await db_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token)
        throw ApiError_1.ApiError.unauthorized("Refresh token revoked");
    const newAccessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
    res.json({ success: true, data: { accessToken: newAccessToken } });
});
// POST /api/auth/logout
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
        try {
            const payload = (0, jwt_1.verifyRefreshToken)(token);
            await db_1.prisma.user.update({
                where: { id: payload.userId },
                data: { refreshToken: null },
            });
        }
        catch { }
    }
    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: true,
        secure: isCrossSite || process.env.NODE_ENV === "production",
        sameSite: isCrossSite ? "none" : "lax",
    });
    res.json({ success: true, message: "Logged out successfully" });
});
// POST /api/auth/forgot-password
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.json({
            success: true,
            message: "If that email exists, a reset link has been sent.",
        });
    }
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
    });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await (0, mailer_1.sendMail)({
        to: email,
        subject: "Reset your password",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    }).catch(() => null);
    res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
    });
});
// POST /api/auth/reset-password
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    const user = await db_1.prisma.user.findFirst({
        where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user)
        throw ApiError_1.ApiError.badRequest("Invalid or expired reset token");
    const hashed = await (0, hash_1.hashPassword)(password);
    await db_1.prisma.user.update({
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
});
// GET /api/auth/me
exports.me = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { profile: true },
    });
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    const { password, refreshToken, resetToken, verificationToken, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
});
// POST /api/auth/google
exports.googleAuth = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { credential, role, referralCode } = req.body;
    if (!credential)
        throw ApiError_1.ApiError.badRequest("Missing Google credential");
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw ApiError_1.ApiError.internal("Google Sign-In is not configured on the server (missing GOOGLE_CLIENT_ID)");
    }
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    }
    catch {
        throw ApiError_1.ApiError.unauthorized("Invalid Google credential");
    }
    if (!payload?.email)
        throw ApiError_1.ApiError.unauthorized("Google account has no email");
    if (!payload.email_verified)
        throw ApiError_1.ApiError.unauthorized("Google email is not verified");
    let user = await db_1.prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        let referrer = null;
        if (referralCode) {
            referrer = await db_1.prisma.user.findUnique({ where: { referralCode } });
        }
        const randomPassword = await (0, hash_1.hashPassword)(crypto_1.default.randomBytes(32).toString("hex"));
        user = await db_1.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    fullName: payload.name || payload.email.split("@")[0],
                    email: payload.email,
                    password: randomPassword,
                    role: role === "ORGANIZER" ? "ORGANIZER" : "CUSTOMER",
                    isVerified: true,
                    referralCode: (0, generators_1.generateReferralCode)(payload.name || payload.email),
                    referredById: referrer?.id,
                    profile: { create: { avatarUrl: payload.picture } },
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
                        code: (0, generators_1.generateCouponCode)(),
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
    const accessToken = (0, jwt_1.signAccessToken)(tokenPayload);
    const refreshToken = (0, jwt_1.signRefreshToken)(tokenPayload, true);
    await db_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
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
//# sourceMappingURL=auth.controller.js.map