import { Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';

// PUT /api/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fullName, phone, address, cityId, bio } = req.body;
  const userId = req.user!.userId;

  if (fullName) {
    await prisma.user.update({ where: { id: userId }, data: { fullName } });
  }

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: { phone, address, cityId, bio },
    create: { userId, phone, address, cityId, bio },
  });

  res.json({ success: true, data: profile });
});

// POST /api/profile/avatar
export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = (req as any).file;
  if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'avatars' }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(file.buffer);
  });

  const profile = await prisma.profile.upsert({
    where: { userId: req.user!.userId },
    update: { avatarUrl: result.secure_url },
    create: { userId: req.user!.userId, avatarUrl: result.secure_url },
  });

  res.json({ success: true, data: profile });
});

// GET /api/profile/points
export const myPoints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const points = await prisma.referralPoint.findMany({
    where: { ownerId: req.user!.userId, expiresAt: { gt: new Date() } },
  });
  const balance = points.reduce((sum, p) => sum + p.points, 0);

  const coupons = await prisma.coupon.findMany({
    where: { userId: req.user!.userId, isUsed: false, expiresAt: { gt: new Date() } },
  });

  res.json({ success: true, data: { balance, coupons } });
});
