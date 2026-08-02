import { Response } from 'express';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/wishlist/:eventId
export const toggleWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { eventId } = req.params;

  const existing = await prisma.wishlist.findUnique({ where: { userId_eventId: { userId, eventId } } });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return res.json({ success: true, data: { wishlisted: false } });
  }

  await prisma.wishlist.create({ data: { userId, eventId } });
  res.json({ success: true, data: { wishlisted: true } });
});

// GET /api/wishlist/me
export const myWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await prisma.wishlist.findMany({
    where: { userId: req.user!.userId },
    include: { event: { include: { category: true, city: true, ticketTypes: { select: { price: true } } } } },
  });
  res.json({ success: true, data: list });
});

// GET /api/notifications/me
export const myNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
});

// PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) throw ApiError.notFound('Notification not found');
  if (notification.userId !== req.user!.userId) throw ApiError.forbidden();

  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
  res.json({ success: true, data: updated });
});
