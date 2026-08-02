import { Router } from 'express';
import * as miscController from '../controllers/misc.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/wishlist/:eventId', miscController.toggleWishlist);
router.get('/wishlist/me', miscController.myWishlist);
router.get('/notifications/me', miscController.myNotifications);
router.patch('/notifications/:id/read', miscController.markNotificationRead);

export default router;
