import { Response } from 'express';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/admin/dashboard
export const adminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalOrganizers, totalEvents, totalTransactions, paidOrders] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'ORGANIZER' } }),
    prisma.event.count(),
    prisma.order.count(),
    prisma.order.findMany({ where: { status: 'PAID' }, select: { total: true } }),
  ]);

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    success: true,
    data: { totalUsers, totalOrganizers, totalEvents, totalTransactions, totalRevenue },
  });
});

// GET /api/admin/users
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, role: true, isVerified: true, createdAt: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: users, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
});

// PATCH /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ success: true, data: user });
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/events
export const listAllEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    include: { organizer: { select: { fullName: true, email: true } }, category: true, city: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: events });
});

// PATCH /api/admin/events/:id/status
export const updateEventStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const event = await prisma.event.update({ where: { id: req.params.id }, data: { status } });
  res.json({ success: true, data: event });
});

// GET /api/admin/transactions
export const listAllTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

  const where: any = {};
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } }, event: { select: { title: true } } },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: transactions, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
});

// CRUD categories
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const category = await prisma.category.create({ data: { name, slug, icon } });
  res.status(201).json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Category deleted' });
});

// CRUD cities
export const createCity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, province, country } = req.body;
  const city = await prisma.city.create({ data: { name, province, country } });
  res.status(201).json({ success: true, data: city });
});

export const deleteCity = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.city.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'City deleted' });
});
