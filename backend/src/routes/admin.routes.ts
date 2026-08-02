import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.adminDashboard);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

router.get('/events', adminController.listAllEvents);
router.patch('/events/:id/status', adminController.updateEventStatus);

router.get('/transactions', adminController.listAllTransactions);

router.post('/categories', adminController.createCategory);
router.delete('/categories/:id', adminController.deleteCategory);

router.post('/cities', adminController.createCity);
router.delete('/cities/:id', adminController.deleteCity);

export default router;
