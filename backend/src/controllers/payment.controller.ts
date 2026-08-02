import { Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const MIDTRANS_BASE = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

function authHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY || '';
  const token = Buffer.from(`${key}:`).toString('base64');
  return `Basic ${token}`;
}

// POST /api/payments/:orderId/create
export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { user: true, event: true },
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.userId !== req.user!.userId) throw ApiError.forbidden();
  if (order.status !== 'PENDING') throw ApiError.badRequest('Order is not pending payment');

  const midtransOrderId = `${order.invoiceNumber}-${Date.now()}`;

  let paymentUrl = '';
  try {
    const response = await axios.post(
      `${MIDTRANS_BASE}/transactions`,
      {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: Math.round(Number(order.total)),
        },
        customer_details: {
          first_name: order.user.fullName,
          email: order.user.email,
        },
        item_details: [
          {
            id: order.eventId,
            price: Math.round(Number(order.total)),
            quantity: 1,
            name: order.event.title.slice(0, 50),
          },
        ],
      },
      {
        headers: {
          Authorization: authHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    paymentUrl = response.data.redirect_url;
  } catch (err: any) {
    throw ApiError.internal('Failed to create Midtrans payment session: ' + (err.response?.data?.error_messages || err.message));
  }

  const payment = await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { midtransOrderId, paymentUrl, status: 'PENDING' },
    create: { orderId: order.id, midtransOrderId, paymentUrl, status: 'PENDING' },
  });

  res.json({ success: true, data: payment });
});

// POST /api/payments/webhook  (Midtrans notification callback - no auth)
export const midtransWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { order_id, transaction_status, fraud_status } = req.body;

  const payment = await prisma.payment.findUnique({ where: { midtransOrderId: order_id } });
  if (!payment) throw ApiError.notFound('Payment record not found');

  let newStatus: 'PAID' | 'PENDING' | 'CANCELLED' | 'EXPIRED' = 'PENDING';
  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    newStatus = fraud_status === 'challenge' ? 'PENDING' : 'PAID';
  } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
    newStatus = 'CANCELLED';
  } else if (transaction_status === 'expire') {
    newStatus = 'EXPIRED';
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: newStatus, rawResponse: req.body },
    });

    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: { status: newStatus, ...(newStatus === 'PAID' ? { paidAt: new Date() } : {}) },
      include: { items: true },
    });

    // Release seats if payment failed/expired/cancelled
    if (['CANCELLED', 'EXPIRED'].includes(newStatus)) {
      for (const item of order.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { sold: { decrement: item.quantity } },
        });
      }
    }

    // Generate tickets on successful payment
    if (newStatus === 'PAID') {
      for (const item of order.items) {
        const ticketsData = Array.from({ length: item.quantity }).map(() => ({
          ticketTypeId: item.ticketTypeId,
          orderItemId: item.id,
        }));
        await tx.ticket.createMany({ data: ticketsData });
      }
    }
  });

  res.json({ success: true });
});
