import { Response } from 'express';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/reviews  (CUSTOMER, must be attendee with PAID order)
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { orderId, rating, comment, images } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.userId !== userId) throw ApiError.forbidden('You did not make this order');
  if (order.status !== 'PAID') throw ApiError.badRequest('Only paid orders can be reviewed');

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) throw ApiError.conflict('You already reviewed this order');

  const review = await prisma.review.create({
    data: { userId, eventId: order.eventId, orderId, rating, comment, images: images || [] },
  });

  res.status(201).json({ success: true, data: review });
});

// POST /api/reviews/:id/reply  (ORGANIZER, owner of event only)
export const replyReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reply } = req.body;
  const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { event: true } });
  if (!review) throw ApiError.notFound('Review not found');
  if (review.event.organizerId !== req.user!.userId) throw ApiError.forbidden();

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { reply, repliedAt: new Date() },
  });

  res.json({ success: true, data: updated });
});

// GET /api/reviews/event/:eventId
export const listEventReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { eventId: req.params.eventId },
    include: { user: { select: { fullName: true, profile: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: reviews });
});
