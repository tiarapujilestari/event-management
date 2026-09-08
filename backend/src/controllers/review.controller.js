"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEventReviews = exports.replyReview = exports.createReview = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
// POST /api/reviews
exports.createReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { orderId, rating, comment, images } = req.body;
    const order = await db_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw ApiError_1.ApiError.notFound("Order not found");
    if (order.userId !== userId)
        throw ApiError_1.ApiError.forbidden("You did not make this order");
    if (order.status !== "PAID")
        throw ApiError_1.ApiError.badRequest("Only paid orders can be reviewed");
    const existing = await db_1.prisma.review.findUnique({ where: { orderId } });
    if (existing)
        throw ApiError_1.ApiError.conflict("You already reviewed this order");
    const review = await db_1.prisma.review.create({
        data: {
            userId,
            eventId: order.eventId,
            orderId,
            rating,
            comment,
            images: images || [],
        },
    });
    res.status(201).json({ success: true, data: review });
});
// POST /api/reviews/:id/reply
exports.replyReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reply } = req.body;
    const review = await db_1.prisma.review.findUnique({
        where: { id: req.params.id },
        include: { event: true },
    });
    if (!review)
        throw ApiError_1.ApiError.notFound("Review not found");
    if (review.event.organizerId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    const updated = await db_1.prisma.review.update({
        where: { id: review.id },
        data: { reply, repliedAt: new Date() },
    });
    res.json({ success: true, data: updated });
});
// GET /api/reviews/event/:eventId
exports.listEventReviews = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reviews = await db_1.prisma.review.findMany({
        where: { eventId: req.params.eventId },
        include: { user: { select: { fullName: true, profile: true } } },
        orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: reviews });
});
//# sourceMappingURL=review.controller.js.map