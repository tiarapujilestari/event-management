import { prisma } from '../config/db';

// Runs periodically to mark expired referral points as expired
export async function expirePointsJob() {
  try {
    const result = await prisma.referralPoint.updateMany({
      where: { isExpired: false, expiresAt: { lt: new Date() } },
      data: { isExpired: true },
    });
    if (result.count > 0) {
      console.log(`[scheduler] Expired ${result.count} referral point batches`);
    }
  } catch (err) {
    console.error('[scheduler] Failed to expire points:', err);
  }
}

// Runs periodically to auto-cancel unpaid orders past their expiry (and release seats)
export async function expireOrdersJob() {
  try {
    const expiredOrders = await prisma.order.findMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      include: { items: true },
    });

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { sold: { decrement: item.quantity } },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: 'EXPIRED' } });
      });
    }

    if (expiredOrders.length > 0) {
      console.log(`[scheduler] Expired ${expiredOrders.length} unpaid orders`);
    }
  } catch (err) {
    console.error('[scheduler] Failed to expire orders:', err);
  }
}

export function startSchedulers() {
  // Run every hour
  setInterval(expirePointsJob, 1000 * 60 * 60);
  // Run every 10 minutes
  setInterval(expireOrdersJob, 1000 * 60 * 10);
  console.log('[scheduler] Background jobs started (points expiry, order expiry)');
}
