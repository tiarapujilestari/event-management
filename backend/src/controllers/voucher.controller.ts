import { Response } from "express";
import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/vouchers  (ORGANIZER)
export const createVoucher = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const organizerId = req.user!.userId;
    const {
      eventId,
      code,
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      usageLimit,
      startDate,
      endDate,
    } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound("Event not found");
    if (event.organizerId !== organizerId)
      throw ApiError.forbidden("You do not own this event");

    const voucher = await prisma.voucher.create({
      data: {
        organizerId,
        eventId,
        code,
        discountType,
        discountValue,
        maxDiscount,
        minPurchase,
        usageLimit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json({ success: true, data: voucher });
  },
);

// GET /api/vouchers/event/:eventId
export const listEventVouchers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
    });
    if (!event) throw ApiError.notFound("Event not found");
    if (event.organizerId !== req.user!.userId) throw ApiError.forbidden();

    const vouchers = await prisma.voucher.findMany({
      where: { eventId: req.params.eventId },
    });
    res.json({ success: true, data: vouchers });
  },
);

// DELETE /api/vouchers/:id
export const deleteVoucher = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const voucher = await prisma.voucher.findUnique({
      where: { id: req.params.id },
    });
    if (!voucher) throw ApiError.notFound("Voucher not found");
    if (voucher.organizerId !== req.user!.userId) throw ApiError.forbidden();

    await prisma.voucher.delete({ where: { id: voucher.id } });
    res.json({ success: true, message: "Voucher deleted" });
  },
);
