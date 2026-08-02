import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Ticket Booking Platform API',
      version: '1.0.0',
      description:
        'REST API for the Event Ticket Booking Platform. Base routes: /api/auth, /api/events, /api/orders, /api/payments, /api/reviews, /api/vouchers, /api/organizer, /api/admin, /api/profile.',
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
