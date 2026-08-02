import { Router } from 'express';
import * as voucherController from '../controllers/voucher.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ORGANIZER'));

router.post('/', voucherController.createVoucher);
router.get('/event/:eventId', voucherController.listEventVouchers);
router.delete('/:id', voucherController.deleteVoucher);

export default router;
