"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVoucher = exports.listEventVouchers = exports.createVoucher = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
// POST /api/vouchers  (ORGANIZER)
exports.createVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const organizerId = req.user.userId;
    const { eventId, code, discountType, discountValue, maxDiscount, minPurchase, usageLimit, startDate, endDate, } = req.body;
    const event = await db_1.prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== organizerId)
        throw ApiError_1.ApiError.forbidden("You do not own this event");
    const voucher = await db_1.prisma.voucher.create({
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
});
// GET /api/vouchers/event/:eventId
exports.listEventVouchers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const event = await db_1.prisma.event.findUnique({
        where: { id: req.params.eventId },
    });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    const vouchers = await db_1.prisma.voucher.findMany({
        where: { eventId: req.params.eventId },
    });
    res.json({ success: true, data: vouchers });
});
// DELETE /api/vouchers/:id
exports.deleteVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const voucher = await db_1.prisma.voucher.findUnique({
        where: { id: req.params.id },
    });
    if (!voucher)
        throw ApiError_1.ApiError.notFound("Voucher not found");
    if (voucher.organizerId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    await db_1.prisma.voucher.delete({ where: { id: voucher.id } });
    res.json({ success: true, message: "Voucher deleted" });
});
//# sourceMappingURL=voucher.controller.js.map