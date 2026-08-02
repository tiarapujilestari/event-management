import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { reviewSchema } from '../validators/event.validator';

const router = Router();

router.get('/event/:eventId', reviewController.listEventReviews);
router.post('/', authenticate, authorize('CUSTOMER'), validate(reviewSchema), reviewController.createReview);
router.post('/:id/reply', authenticate, authorize('ORGANIZER'), reviewController.replyReview);

export default router;
