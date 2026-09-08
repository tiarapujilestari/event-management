"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Ticket Booking Platform API',
            version: '1.0.0',
            description: 'REST API for the Event Ticket Booking Platform. Base routes: /api/auth, /api/events, /api/orders, /api/payments, /api/reviews, /api/vouchers, /api/organizer, /api/admin, /api/profile.',
        },
        servers: [{ url: '/api', description: 'API base path' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [],
});
//# sourceMappingURL=swagger.js.map