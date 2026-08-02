import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import xssClean from 'xss-clean';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import voucherRoutes from './routes/voucher.routes';
import miscRoutes from './routes/misc.routes';
import organizerRoutes from './routes/organizer.routes';
import adminRoutes from './routes/admin.routes';
import profileRoutes from './routes/profile.routes';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { swaggerSpec } from './docs/swagger';

const app = express();

// ---- Security & core middleware ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(xssClean());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- Health check ----
app.get('/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));

// ---- API docs ----
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api', miscRoutes); // /api/wishlist/*, /api/notifications/*
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// ---- Error handling ----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
