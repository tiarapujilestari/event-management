import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate, authorize('CUSTOMER', 'ADMIN'));

router.post('/checkout', validate(createOrderSchema), orderController.checkout);
router.get('/me', orderController.myOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

export default router;
