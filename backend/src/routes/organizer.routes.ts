import { Router } from 'express';
import * as organizerController from '../controllers/organizer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ORGANIZER'));

router.get('/dashboard', organizerController.organizerDashboard);
router.get('/events/:eventId/attendees', organizerController.eventAttendees);
router.get('/events/:eventId/attendees/export', organizerController.exportAttendeesCsv);

export default router;
