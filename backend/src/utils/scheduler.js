"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expirePointsJob = expirePointsJob;
exports.expireOrdersJob = expireOrdersJob;
exports.startSchedulers = startSchedulers;
const db_1 = require("../config/db");
async function expirePointsJob() {
    try {
        const result = await db_1.prisma.referralPoint.updateMany({
            where: { isExpired: false, expiresAt: { lt: new Date() } },
            data: { isExpired: true },
        });
        if (result.count > 0) {
            console.log(`[scheduler] Expired ${result.count} referral point batches`);
        }
    }
    catch (err) {
        console.error("[scheduler] Failed to expire points:", err);
    }
}
async function expireOrdersJob() {
    try {
        const expiredOrders = await db_1.prisma.order.findMany({
            where: { status: "PENDING", expiresAt: { lt: new Date() } },
            include: { items: true },
        });
        for (const order of expiredOrders) {
            await db_1.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    await tx.ticketType.update({
                        where: { id: item.ticketTypeId },
                        data: { sold: { decrement: item.quantity } },
                    });
                }
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "EXPIRED" },
                });
            });
        }
        if (expiredOrders.length > 0) {
            console.log(`[scheduler] Expired ${expiredOrders.length} unpaid orders`);
        }
    }
    catch (err) {
        console.error("[scheduler] Failed to expire orders:", err);
    }
}
function startSchedulers() {
    // Run every hour
    setInterval(expirePointsJob, 1000 * 60 * 60);
    // Run every 10 minutes
    setInterval(expireOrdersJob, 1000 * 60 * 10);
    console.log("[scheduler] Background jobs started (points expiry, order expiry)");
}
//# sourceMappingURL=scheduler.js.map