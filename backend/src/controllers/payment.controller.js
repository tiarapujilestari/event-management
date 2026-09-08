"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPaymentProof = exports.getBankInfo = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const BANK_TRANSFER_DESTINATION = {
    bank: "Bank Central Asia (BCA)",
    accountName: "Eventify Demo Org",
    accountNumber: "1234567890",
};
// GET /api/payments/bank-info
exports.getBankInfo = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: BANK_TRANSFER_DESTINATION });
});
// POST /api/payments/:orderId/proof
exports.uploadPaymentProof = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const order = await db_1.prisma.order.findUnique({
        where: { id: req.params.orderId },
    });
    if (!order)
        throw ApiError_1.ApiError.notFound("Order not found");
    if (order.userId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden("You cannot pay for this order");
    if (order.status !== "PENDING") {
        throw ApiError_1.ApiError.badRequest("Payment proof can only be uploaded while the order is waiting for payment");
    }
    const file = req.file;
    if (!file)
        throw ApiError_1.ApiError.badRequest("Payment proof image is required");
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: "payment_proofs" }, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
        stream.end(file.buffer);
    });
    const updatedOrder = await db_1.prisma.$transaction(async (tx) => {
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
});
//# sourceMappingURL=payment.controller.js.map