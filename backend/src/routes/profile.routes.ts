import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordSchema } from '../validators/auth.validator';

const router = Router();

router.use(authenticate);

router.put('/', profileController.updateProfile);
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);
router.get('/points', profileController.myPoints);
router.put('/change-password', validate(changePasswordSchema), profileController.changePassword);

export default router;
