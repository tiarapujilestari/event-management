import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.put('/', profileController.updateProfile);
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);
router.get('/points', profileController.myPoints);

export default router;
