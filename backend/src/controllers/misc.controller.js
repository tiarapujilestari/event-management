"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.myNotifications = exports.myWishlist = exports.toggleWishlist = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
// POST /api/wishlist/:eventId
exports.toggleWishlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { eventId } = req.params;
    const existing = await db_1.prisma.wishlist.findUnique({ where: { userId_eventId: { userId, eventId } } });
    if (existing) {
        await db_1.prisma.wishlist.delete({ where: { id: existing.id } });
        return res.json({ success: true, data: { wishlisted: false } });
    }
    await db_1.prisma.wishlist.create({ data: { userId, eventId } });
    res.json({ success: true, data: { wishlisted: true } });
});
// GET /api/wishlist/me
exports.myWishlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const list = await db_1.prisma.wishlist.findMany({
        where: { userId: req.user.userId },
        include: { event: { include: { category: true, city: true, ticketTypes: { select: { price: true } } } } },
    });
    res.json({ success: true, data: list });
});
// GET /api/notifications/me
exports.myNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await db_1.prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json({ success: true, data: notifications });
});
// PATCH /api/notifications/:id/read
exports.markNotificationRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notification = await db_1.prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification)
        throw ApiError_1.ApiError.notFound('Notification not found');
    if (notification.userId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    const updated = await db_1.prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
    res.json({ success: true, data: updated });
});
//# sourceMappingURL=misc.controller.js.map