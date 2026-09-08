"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
        description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
        categoryId: zod_1.z.string().uuid('Invalid category'),
        cityId: zod_1.z.string().uuid('Invalid city'),
        venue: zod_1.z.string().min(3),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
        isFree: zod_1.z.boolean().optional(),
        maxPurchase: zod_1.z.number().int().positive().optional(),
        bannerUrl: zod_1.z.string().url().optional(),
        ticketTypes: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().min(1),
            price: zod_1.z.number().min(0),
            quota: zod_1.z.number().int().positive(),
            description: zod_1.z.string().optional(),
        }))
            .min(1, 'At least one ticket type is required'),
    }),
});
exports.updateEventSchema = zod_1.z.object({
    body: exports.createEventSchema.shape.body.partial(),
});
exports.reviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: zod_1.z.string().uuid(),
        rating: zod_1.z.number().int().min(1).max(5),
        comment: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string().url()).optional(),
    }),
});
//# sourceMappingURL=event.validator.js.map