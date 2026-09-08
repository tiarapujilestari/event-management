"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.string().uuid(),
        items: zod_1.z
            .array(zod_1.z.object({
            ticketTypeId: zod_1.z.string().uuid(),
            quantity: zod_1.z.number().int().positive(),
        }))
            .min(1),
        voucherCode: zod_1.z.string().optional(),
        couponCode: zod_1.z.string().optional(),
        pointsToUse: zod_1.z.number().int().min(0).optional(),
    }),
});
//# sourceMappingURL=order.validator.js.map