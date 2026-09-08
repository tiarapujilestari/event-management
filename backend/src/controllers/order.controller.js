"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getOrderById = exports.myOrders = exports.checkout = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const generators_1 = require("../utils/generators");
const asyncHandler_1 = require("../middleware/asyncHandler");
// POST /api/orders/checkout  (CUSTOMER)
exports.checkout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { eventId, items, voucherCode, couponCode, pointsToUse = 0, } = req.body;
    const order = await db_1.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event || event.status !== "PUBLISHED")
            throw ApiError_1.ApiError.badRequest("Event is not available for booking");
        let subtotal = 0;
        const orderItemsData = [];
        for (const item of items) {
            const ticketType = await tx.ticketType.findUnique({
                where: { id: item.ticketTypeId },
            });
            if (!ticketType || ticketType.eventId !== eventId) {
                throw ApiError_1.ApiError.badRequest("Invalid ticket type");
            }
            const remaining = ticketType.quota - ticketType.sold;
            if (remaining < item.quantity) {
                throw ApiError_1.ApiError.badRequest(`Not enough seats available for "${ticketType.name}"`);
            }
            const lineTotal = Number(ticketType.price) * item.quantity;
            subtotal += lineTotal;
            await tx.ticketType.update({
                where: { id: item.ticketTypeId },
                data: { sold: { increment: item.quantity } },
            });
            orderItemsData.push({
                ticketTypeId: item.ticketTypeId,
                quantity: item.quantity,
                price: ticketType.price,
            });
        }
        let discountTotal = 0;
        let voucherId;
        let couponId;
        // Voucher
        if (voucherCode) {
            const voucher = await tx.voucher.findUnique({
                where: { code: voucherCode },
            });
            if (!voucher || voucher.eventId !== eventId)
                throw ApiError_1.ApiError.badRequest("Invalid voucher code");
            if (voucher.usedCount >= voucher.usageLimit)
                throw ApiError_1.ApiError.badRequest("Voucher usage limit reached");
            if (new Date() < voucher.startDate || new Date() > voucher.endDate) {
                throw ApiError_1.ApiError.badRequest("Voucher is not active");
            }
            if (Number(voucher.minPurchase) > subtotal) {
                throw ApiError_1.ApiError.badRequest(`Minimum purchase of ${voucher.minPurchase} required for this voucher`);
            }
            const voucherDiscount = voucher.discountType === "PERCENTAGE"
                ? (subtotal * Number(voucher.discountValue)) / 100
                : Number(voucher.discountValue);
            discountTotal += voucher.maxDiscount
                ? Math.min(voucherDiscount, Number(voucher.maxDiscount))
                : voucherDiscount;
            voucherId = voucher.id;
            await tx.voucher.update({
                where: { id: voucher.id },
                data: { usedCount: { increment: 1 } },
            });
        }
        // Referral coupon
        if (couponCode) {
            const coupon = await tx.coupon.findFirst({
                where: { code: couponCode, userId },
            });
            if (!coupon)
                throw ApiError_1.ApiError.badRequest("Invalid coupon code");
            if (coupon.isUsed)
                throw ApiError_1.ApiError.badRequest("Coupon already used");
            if (new Date() > coupon.expiresAt)
                throw ApiError_1.ApiError.badRequest("Coupon has expired");
            const couponDiscount = coupon.discountType === "PERCENTAGE"
                ? (subtotal * Number(coupon.discountValue)) / 100
                : Number(coupon.discountValue);
            discountTotal += couponDiscount;
            couponId = coupon.id;
            await tx.coupon.update({
                where: { id: coupon.id },
                data: { isUsed: true },
            });
        }
        // Points redemption
        let pointsUsed = 0;
        if (pointsToUse > 0) {
            const points = await tx.referralPoint.findMany({
                where: {
                    ownerId: userId,
                    isExpired: false,
                    expiresAt: { gt: new Date() },
                },
            });
            const availablePoints = points.reduce((sum, p) => sum + p.points, 0);
            pointsUsed = Math.min(pointsToUse, availablePoints, subtotal - discountTotal);
            if (pointsUsed > 0) {
                discountTotal += pointsUsed;
                await tx.pointHistory.create({
                    data: {
                        userId,
                        points: -pointsUsed,
                        type: "REDEEMED",
                        note: `Used on order for event ${event.title}`,
                    },
                });
                await tx.referralPoint.create({
                    data: {
                        ownerId: userId,
                        points: -pointsUsed,
                        expiresAt: new Date(),
                    },
                });
            }
        }
        const total = Math.max(0, subtotal - discountTotal);
        const newOrder = await tx.order.create({
            data: {
                userId,
                eventId,
                invoiceNumber: (0, generators_1.generateInvoiceNumber)(),
                subtotal,
                discountTotal,
                pointsUsed,
                total,
                status: "PENDING",
                voucherId,
                couponId,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours to pay
                items: { create: orderItemsData },
            },
            include: { items: { include: { ticketType: true } } },
        });
        return newOrder;
    });
    res.status(201).json({
        success: true,
        data: order,
        message: "Order created. Proceed to payment.",
    });
});
// GET /api/orders/me
exports.myOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const orders = await db_1.prisma.order.findMany({
        where: { userId: req.user.userId },
        include: {
            event: {
                select: { title: true, slug: true, bannerUrl: true, startDate: true },
            },
            items: { include: { ticketType: true } },
            payment: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: orders });
});
// GET /api/orders/:id
exports.getOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const order = await db_1.prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
            event: true,
            items: { include: { ticketType: true, tickets: true } },
            payment: true,
            user: { select: { fullName: true, email: true } },
        },
    });
    if (!order)
        throw ApiError_1.ApiError.notFound("Order not found");
    if (order.userId !== req.user.userId && req.user.role !== "ADMIN") {
        throw ApiError_1.ApiError.forbidden("You cannot view this order");
    }
    res.json({ success: true, data: order });
});
// POST /api/orders/:id/cancel
exports.cancelOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const order = await db_1.prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
    });
    if (!order)
        throw ApiError_1.ApiError.notFound("Order not found");
    if (order.userId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    if (order.status !== "PENDING")
        throw ApiError_1.ApiError.badRequest("Only pending orders can be cancelled");
    await db_1.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
            await tx.ticketType.update({
                where: { id: item.ticketTypeId },
                data: { sold: { decrement: item.quantity } },
            });
        }
        await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
        });
    });
    res.json({ success: true, message: "Order cancelled" });
});
//# sourceMappingURL=order.controller.js.map