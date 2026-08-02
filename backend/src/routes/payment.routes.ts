import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook', paymentController.midtransWebhook); // Public - called by Midtrans
router.post('/:orderId/create', authenticate, authorize('CUSTOMER'), paymentController.createPayment);

export default router;
