import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { generateSlug } from '../utils/generators';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/events
// Query: search, category, city, minPrice, maxPrice, startDate, endDate, sort, page, limit, status
export const listEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    search,
    category,
    city,
    minPrice,
    maxPrice,
    startDate,
    endDate,
    organizerId,
    sort = 'newest',
    page = '1',
    limit = '12',
    status,
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));

  const where: Prisma.EventWhereInput = {
    status: (status as any) || 'PUBLISHED',
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { venue: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { slug: category };
  if (city) where.city = { name: { equals: city, mode: 'insensitive' } };
  if (organizerId) where.organizerId = organizerId;
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

  let orderBy: Prisma.EventOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { wishlistedBy: { _count: 'desc' } };
  if (sort === 'oldest') orderBy = { createdAt: 'asc' };
  // lowest/highest price handled after fetch since it's on a relation aggregate

  const [events, total] = await Promise.all([
    prisma.event.findMany({
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
        ticketTypes: { select: { id: true, name: true, price: true, quota: true, sold: true } },
        _count: { select: { wishlistedBy: true, reviews: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  let result = events.map((e) => ({
    ...e,
    minPrice: e.ticketTypes.length ? Math.min(...e.ticketTypes.map((t) => Number(t.price))) : 0,
  }));

  if (sort === 'price_low') result = result.sort((a, b) => a.minPrice - b.minPrice);
  if (sort === 'price_high') result = result.sort((a, b) => b.minPrice - a.minPrice);

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
export const getEventBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      city: true,
      images: true,
      ticketTypes: true,
      organizer: { select: { id: true, fullName: true, profile: true } },
      reviews: {
        include: { user: { select: { fullName: true, profile: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { wishlistedBy: true } },
    },
  });

  if (!event) throw ApiError.notFound('Event not found');

  const avgRating =
    event.reviews.length > 0
      ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
      : 0;

  const relatedEvents = await prisma.event.findMany({
    where: {
      categoryId: event.categoryId,
      id: { not: event.id },
      status: 'PUBLISHED',
    },
    take: 4,
    include: { category: true, city: true, ticketTypes: { select: { price: true } } },
  });

  res.json({ success: true, data: { ...event, avgRating: Number(avgRating.toFixed(1)), relatedEvents } });
});

// POST /api/events  (ORGANIZER only)
export const createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organizerId = req.user!.userId;
  const { title, description, categoryId, cityId, venue, latitude, longitude, startDate, endDate, isFree, maxPurchase, bannerUrl, ticketTypes } =
    req.body;

  const slug = generateSlug(title);

  const event = await prisma.event.create({
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
      status: 'DRAFT',
      ticketTypes: { create: ticketTypes },
    },
    include: { ticketTypes: true },
  });

  res.status(201).json({ success: true, data: event });
});

// PUT /api/events/:id  (ORGANIZER, owner only)
export const updateEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not own this event');
  }

  const { ticketTypes, startDate, endDate, ...rest } = req.body;

  const updated = await prisma.event.update({
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
export const deleteEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not own this event');
  }

  await prisma.event.delete({ where: { id } });
  res.json({ success: true, message: 'Event deleted successfully' });
});

// PATCH /api/events/:id/publish
export const publishEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not own this event');
  }

  const updated = await prisma.event.update({ where: { id }, data: { status: 'PUBLISHED' } });
  res.json({ success: true, data: updated });
});

// GET /api/events/organizer/mine (ORGANIZER)
export const myEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    where: { organizerId: req.user!.userId },
    include: { category: true, city: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: events });
});

// GET /api/categories
export const listCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: categories });
});

// GET /api/cities
export const listCities = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: cities });
});
