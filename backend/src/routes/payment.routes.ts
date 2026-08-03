import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

// Anyone logged in can see where to transfer money to
router.get('/bank-info', paymentController.getBankInfo);

// Only the customer who owns the order can upload their own proof
router.post('/:orderId/proof', authorize('CUSTOMER'), upload.single('proof'), paymentController.uploadPaymentProof);

export default router;
