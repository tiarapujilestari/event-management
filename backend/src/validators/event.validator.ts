import { z } from 'zod';

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z.string().uuid('Invalid category'),
    cityId: z.string().uuid('Invalid city'),
    venue: z.string().min(3),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    startDate: z.string(),
    endDate: z.string(),
    isFree: z.boolean().optional(),
    maxPurchase: z.number().int().positive().optional(),
    bannerUrl: z.string().url().optional(),
    ticketTypes: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.number().min(0),
          quota: z.number().int().positive(),
          description: z.string().optional(),
        })
      )
      .min(1, 'At least one ticket type is required'),
  }),
});

export const updateEventSchema = z.object({
  body: createEventSchema.shape.body.partial(),
});

export const reviewSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    images: z.array(z.string().url()).optional(),
  }),
});
