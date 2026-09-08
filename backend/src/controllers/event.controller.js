"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCities = exports.listCategories = exports.myEvents = exports.publishEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventBySlug = exports.listEvents = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const generators_1 = require("../utils/generators");
const asyncHandler_1 = require("../middleware/asyncHandler");
// GET /api/events
exports.listEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { search, category, city, minPrice, maxPrice, startDate, endDate, organizerId, sort = "newest", page = "1", limit = "12", status, } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const where = {
        status: status || "PUBLISHED",
    };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { venue: { contains: search, mode: "insensitive" } },
        ];
    }
    if (category)
        where.category = { slug: category };
    if (city)
        where.city = { name: { equals: city, mode: "insensitive" } };
    if (organizerId)
        where.organizerId = organizerId;
    if (startDate || endDate) {
        where.startDate = {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
        };
    }
    if (minPrice || maxPrice) {
        where.ticketTypes = {
            some: {
                price: {
                    ...(minPrice ? { gte: Number(minPrice) } : {}),
                    ...(maxPrice ? { lte: Number(maxPrice) } : {}),
                },
            },
        };
    }
    let orderBy = { createdAt: "desc" };
    if (sort === "popular")
        orderBy = { wishlistedBy: { _count: "desc" } };
    if (sort === "oldest")
        orderBy = { createdAt: "asc" };
    const [events, total] = await Promise.all([
        db_1.prisma.event.findMany({
            where,
            orderBy,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                bannerUrl: true,
                category: true,
                city: true,
                venue: true,
                startDate: true,
                endDate: true,
                isFree: true,
                status: true,
                ticketTypes: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        quota: true,
                        sold: true,
                    },
                },
                _count: { select: { wishlistedBy: true, reviews: true } },
            },
        }),
        db_1.prisma.event.count({ where }),
    ]);
    let result = events.map((e) => ({
        ...e,
        minPrice: e.ticketTypes.length
            ? Math.min(...e.ticketTypes.map((t) => Number(t.price)))
            : 0,
    }));
    if (sort === "price_low")
        result = result.sort((a, b) => a.minPrice - b.minPrice);
    if (sort === "price_high")
        result = result.sort((a, b) => b.minPrice - a.minPrice);
    res.json({
        success: true,
        data: result,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
// GET /api/events/:slug
exports.getEventBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const event = await db_1.prisma.event.findUnique({
        where: { slug },
        include: {
            category: true,
            city: true,
            images: true,
            ticketTypes: true,
            organizer: { select: { id: true, fullName: true, profile: true } },
            reviews: {
                include: { user: { select: { fullName: true, profile: true } } },
                orderBy: { createdAt: "desc" },
            },
            _count: { select: { wishlistedBy: true } },
        },
    });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    const avgRating = event.reviews.length > 0
        ? event.reviews.reduce((sum, r) => sum + r.rating, 0) /
            event.reviews.length
        : 0;
    const relatedEvents = await db_1.prisma.event.findMany({
        where: {
            categoryId: event.categoryId,
            id: { not: event.id },
            status: "PUBLISHED",
        },
        take: 4,
        include: {
            category: true,
            city: true,
            ticketTypes: { select: { price: true } },
        },
    });
    res.json({
        success: true,
        data: {
            ...event,
            avgRating: Number(avgRating.toFixed(1)),
            relatedEvents,
        },
    });
});
// POST /api/events  (ORGANIZER only)
exports.createEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const organizerId = req.user.userId;
    const { title, description, categoryId, cityId, venue, latitude, longitude, startDate, endDate, isFree, maxPurchase, bannerUrl, ticketTypes, } = req.body;
    const slug = (0, generators_1.generateSlug)(title);
    const event = await db_1.prisma.event.create({
        data: {
            organizerId,
            title,
            slug,
            description,
            categoryId,
            cityId,
            venue,
            latitude,
            longitude,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isFree: !!isFree,
            maxPurchase: maxPurchase || 4,
            bannerUrl,
            status: "DRAFT",
            ticketTypes: { create: ticketTypes },
        },
        include: { ticketTypes: true },
    });
    res.status(201).json({ success: true, data: event });
});
// PUT /api/events/:id
exports.updateEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const event = await db_1.prisma.event.findUnique({ where: { id } });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId && req.user.role !== "ADMIN") {
        throw ApiError_1.ApiError.forbidden("You do not own this event");
    }
    const { ticketTypes, startDate, endDate, ...rest } = req.body;
    const updated = await db_1.prisma.event.update({
        where: { id },
        data: {
            ...rest,
            ...(startDate ? { startDate: new Date(startDate) } : {}),
            ...(endDate ? { endDate: new Date(endDate) } : {}),
        },
    });
    res.json({ success: true, data: updated });
});
// DELETE /api/events/:id (ORGANIZER, owner only)
exports.deleteEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const event = await db_1.prisma.event.findUnique({ where: { id } });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId && req.user.role !== "ADMIN") {
        throw ApiError_1.ApiError.forbidden("You do not own this event");
    }
    await db_1.prisma.event.delete({ where: { id } });
    res.json({ success: true, message: "Event deleted successfully" });
});
// PATCH /api/events/:id/publish
exports.publishEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const event = await db_1.prisma.event.findUnique({ where: { id } });
    if (!event)
        throw ApiError_1.ApiError.notFound("Event not found");
    if (event.organizerId !== req.user.userId && req.user.role !== "ADMIN") {
        throw ApiError_1.ApiError.forbidden("You do not own this event");
    }
    const updated = await db_1.prisma.event.update({
        where: { id },
        data: { status: "PUBLISHED" },
    });
    res.json({ success: true, data: updated });
});
// GET /api/events/organizer/mine (ORGANIZER)
exports.myEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const events = await db_1.prisma.event.findMany({
        where: { organizerId: req.user.userId },
        include: {
            category: true,
            city: true,
            _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: events });
});
// GET /api/categories
exports.listCategories = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await db_1.prisma.category.findMany({
        orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
});
// GET /api/cities
exports.listCities = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const cities = await db_1.prisma.city.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data: cities });
});
//# sourceMappingURL=event.controller.js.map