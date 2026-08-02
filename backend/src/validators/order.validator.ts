import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    eventId: z.string().uuid(),
    items: z
      .array(
        z.object({
          ticketTypeId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
    voucherCode: z.string().optional(),
    couponCode: z.string().optional(),
    pointsToUse: z.number().int().min(0).optional(),
  }),
});
