import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';

const router = Router();

router.get('/categories/all', eventController.listCategories);
router.get('/cities/all', eventController.listCities);

router.get('/organizer/mine', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.myEvents);

router.get('/', eventController.listEvents);
router.get('/:slug', eventController.getEventBySlug);

router.post('/', authenticate, authorize('ORGANIZER'), validate(createEventSchema), eventController.createEvent);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.deleteEvent);
router.patch('/:id/publish', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.publishEvent);

export default router;
