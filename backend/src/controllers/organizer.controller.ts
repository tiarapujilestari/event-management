import { Response } from 'express';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/organizer/dashboard  (ORGANIZER)
export const organizerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organizerId = req.user!.userId;

  const events = await prisma.event.findMany({ where: { organizerId }, select: { id: true, status: true, title: true, startDate: true } });
  const eventIds = events.map((e) => e.id);

  const orders = await prisma.order.findMany({
    where: { eventId: { in: eventIds }, status: 'PAID' },
    include: { items: true },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalTicketsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const totalOrders = orders.length;

  // Revenue grouped by month (last 6 months)
  const revenueByMonth: Record<string, number> = {};
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(o.total);
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => e.status === 'PUBLISHED' && e.startDate > now).length;
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

// GET /api/organizer/events/:eventId/attendees  (ORGANIZER, owner)
export const eventAttendees = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user!.userId) throw ApiError.forbidden();

  const orders = await prisma.order.findMany({
    where: { eventId: event.id, status: 'PAID' },
    include: { user: { select: { fullName: true, email: true } }, items: { include: { ticketType: true } } },
  });

  const attendees = orders.map((o) => ({
    name: o.user.fullName,
    email: o.user.email,
    invoiceNumber: o.invoiceNumber,
    tickets: o.items.map((i) => `${i.ticketType.name} x${i.quantity}`).join(', '),
    total: o.total,
    paidAt: o.paidAt,
  }));

  res.json({ success: true, data: attendees });
});

// GET /api/organizer/events/:eventId/attendees/export  (CSV)
export const exportAttendeesCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user!.userId) throw ApiError.forbidden();

  const orders = await prisma.order.findMany({
    where: { eventId: event.id, status: 'PAID' },
    include: { user: { select: { fullName: true, email: true } }, items: { include: { ticketType: true } } },
  });

  const header = 'Name,Email,Invoice,Tickets,Total,PaidAt\n';
  const rows = orders
    .map((o) => {
      const tickets = o.items.map((i) => `${i.ticketType.name} x${i.quantity}`).join(' | ');
      return `"${o.user.fullName}","${o.user.email}","${o.invoiceNumber}","${tickets}","${o.total}","${o.paidAt?.toISOString() || ''}"`;
    })
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendees-${event.slug}.csv"`);
  res.send(header + rows);
});
