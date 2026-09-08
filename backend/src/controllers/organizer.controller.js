"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAttendeesCsv = exports.eventAttendees = exports.organizerDashboard = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../middleware/asyncHandler");
// GET /api/organizer/dashboard
exports.organizerDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const organizerId = req.user.userId;
    const events = await db_1.prisma.event.findMany({
        where: { organizerId },
        select: { id: true, status: true, title: true, startDate: true },
    });
    const eventIds = events.map((e) => e.id);
    const orders = await db_1.prisma.order.findMany({
        where: { eventId: { in: eventIds }, status: "PAID" },
        include: { items: true },
    });
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalTicketsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const totalOrders = orders.length;
    // Revenue
    const revenueByMonth = {};
    for (const o of orders) {
        const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(o.total);
    }
    const now = new Date();
    const upcomingEvents = events.filter((e) => e.status === "PUBLISHED" && e.startDate > now).length;
    const expiredEvents = events.filter((e) => e.startDate <= now).length;
    res.json({
        success: true,
        data: {
            totalRevenue,
            totalTicketsSold,
            totalOrders,
            totalEvents: events.length,
            upcomingEvents,
            expiredEvents,
            revenueChart: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
        },
    });
});
// GET /api/organizer/events/:eventId/attendees
exports.eventAttendees = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const event = await db_1.prisma.event.findUnique({
        where: { id: req.params.eventId },
    });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    const orders = await db_1.prisma.order.findMany({
        where: { eventId: event.id, status: "PAID" },
        include: {
            user: { select: { fullName: true, email: true } },
            items: { include: { ticketType: true } },
        },
    });
    const attendees = orders.map((o) => ({
        name: o.user.fullName,
        email: o.user.email,
        invoiceNumber: o.invoiceNumber,
        tickets: o.items
            .map((i) => `${i.ticketType.name} x${i.quantity}`)
            .join(", "),
        total: o.total,
        paidAt: o.paidAt,
    }));
    res.json({ success: true, data: attendees });
});
// GET /api/organizer/events/:eventId/attendees/export
exports.exportAttendeesCsv = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const event = await db_1.prisma.event.findUnique({
        where: { id: req.params.eventId },
    });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId)
        throw ApiError_1.ApiError.forbidden();
    const orders = await db_1.prisma.order.findMany({
        where: { eventId: event.id, status: "PAID" },
        include: {
            user: { select: { fullName: true, email: true } },
            items: { include: { ticketType: true } },
        },
    });
    const header = "Name,Email,Invoice,Tickets,Total,PaidAt\n";
    const rows = orders
        .map((o) => {
        const tickets = o.items
            .map((i) => `${i.ticketType.name} x${i.quantity}`)
            .join(" | ");
        return `"${o.user.fullName}","${o.user.email}","${o.invoiceNumber}","${tickets}","${o.total}","${o.paidAt?.toISOString() || ""}"`;
    })
        .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="attendees-${event.slug}.csv"`);
    res.send(header + rows);
});
//# sourceMappingURL=organizer.controller.js.map