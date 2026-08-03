import { Response } from "express";
import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import cloudinary from "../config/cloudinary";

const BANK_TRANSFER_DESTINATION = {
  bank: "Bank Central Asia (BCA)",
  accountName: "Eventify Demo Org",
  accountNumber: "1234567890",
};

// GET /api/payments/bank-info
export const getBankInfo = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    res.json({ success: true, data: BANK_TRANSFER_DESTINATION });
  },
);

// POST /api/payments/:orderId/proof
export const uploadPaymentProof = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.userId !== req.user!.userId)
      throw ApiError.forbidden("You cannot pay for this order");
    if (order.status !== "PENDING") {
      throw ApiError.badRequest(
        "Payment proof can only be uploaded while the order is waiting for payment",
      );
    }

    const file = (req as any).file;
    if (!file) throw ApiError.badRequest("Payment proof image is required");

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "payment_proofs" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          proofUrl: uploadResult.secure_url,
          status: "WAITING_CONFIRMATION",
        },
        create: {
          orderId: order.id,
          proofUrl: uploadResult.secure_url,
          status: "WAITING_CONFIRMATION",
        },
      });

      const newDeadline = new Date(Date.now() + 1000 * 60 * 60 * 3);

      return tx.order.update({
        where: { id: order.id },
        data: { status: "WAITING_CONFIRMATION", expiresAt: newDeadline },
        include: { payment: true },
      });
    });

    res.json({
      success: true,
      message: "Payment proof uploaded. Waiting for admin confirmation.",
      data: updatedOrder,
    });
  },
);
