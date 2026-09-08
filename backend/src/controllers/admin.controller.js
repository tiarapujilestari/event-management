"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.createCity = exports.deleteCategory = exports.createCategory = exports.confirmPayment = exports.listAllTransactions = exports.updateEventStatus = exports.listAllEvents = exports.deleteUser = exports.updateUserRole = exports.listUsers = exports.adminDashboard = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
// GET /api/admin/dashboard
exports.adminDashboard = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [totalUsers, totalOrganizers, totalEvents, totalTransactions, paidOrders,] = await Promise.all([
        db_1.prisma.user.count({ where: { role: "CUSTOMER" } }),
        db_1.prisma.user.count({ where: { role: "ORGANIZER" } }),
        db_1.prisma.event.count(),
        db_1.prisma.order.count(),
        db_1.prisma.order.findMany({
            where: { status: "PAID" },
            select: { total: true },
        }),
    ]);
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    res.json({
        success: true,
        data: {
            totalUsers,
            totalOrganizers,
            totalEvents,
            totalTransactions,
            totalRevenue,
        },
    });
});
// GET /api/admin/users
exports.listUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role, search, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const where = {};
    if (role)
        where.role = role;
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    const [users, total] = await Promise.all([
        db_1.prisma.user.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: "desc" },
        }),
        db_1.prisma.user.count({ where }),
    ]);
    res.json({
        success: true,
        data: users,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
// PATCH /api/admin/users/:id/role
exports.updateUserRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role } = req.body;
    const user = await db_1.prisma.user.update({
        where: { id: req.params.id },
        data: { role },
    });
    res.json({ success: true, data: user });
});
// DELETE /api/admin/users/:id
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await db_1.prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "User deleted" });
});
// GET /api/admin/events
exports.listAllEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const events = await db_1.prisma.event.findMany({
        include: {
            organizer: { select: { fullName: true, email: true } },
            category: true,
            city: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: events });
});
// PATCH /api/admin/events/:id/status
exports.updateEventStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    const event = await db_1.prisma.event.update({
        where: { id: req.params.id },
        data: { status },
    });
    res.json({ success: true, data: event });
});
// GET /api/admin/transactions
exports.listAllTransactions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const where = {};
    if (status)
        where.status = status;
    const [transactions, total] = await Promise.all([
        db_1.prisma.order.findMany({
            where,
            include: {
                user: { select: { fullName: true, email: true } },
                event: { select: { title: true } },
                payment: { select: { proofUrl: true, status: true } },
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: "desc" },
        }),
        db_1.prisma.order.count({ where }),
    ]);
    res.json({
        success: true,
        data: transactions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
// PATCH /api/admin/transactions/:id/confirm
exports.confirmPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const order = await db_1.prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true, payment: true },
    });
    if (!order)
        throw ApiError_1.ApiError.notFound("Order not found");
    if (order.status !== "WAITING_CONFIRMATION") {
        throw ApiError_1.ApiError.badRequest("This order is not waiting for payment confirmation");
    }
    const updated = await db_1.prisma.$transaction(async (tx) => {
        if (order.payment) {
            await tx.payment.update({
                where: { id: order.payment.id },
                data: { status: "PAID" },
            });
        }
        const paidOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: "PAID", paidAt: new Date() },
        });
        for (const item of order.items) {
            const ticketsData = Array.from({ length: item.quantity }).map(() => ({
                ticketTypeId: item.ticketTypeId,
                orderItemId: item.id,
            }));
            await tx.ticket.createMany({ data: ticketsData });
        }
        return paidOrder;
    });
    res.json({
        success: true,
        message: "Payment confirmed. Tickets have been issued.",
        data: updated,
    });
});
// CRUD categories
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await db_1.prisma.category.create({
        data: { name, slug, icon },
    });
    res.status(201).json({ success: true, data: category });
});
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await db_1.prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Category deleted" });
});
// CRUD cities
exports.createCity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, province, country } = req.body;
    const city = await db_1.prisma.city.create({
        data: { name, province, country },
    });
    res.status(201).json({ success: true, data: city });
});
exports.deleteCity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await db_1.prisma.city.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "City deleted" });
});
//# sourceMappingURL=admin.controller.js.map