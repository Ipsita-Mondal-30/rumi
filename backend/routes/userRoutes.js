import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadProfilePhoto as multerProfilePhoto } from '../middleware/upload.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Protected: require JWT
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/profile/photo', authenticate, multerProfilePhoto, userController.uploadProfilePhoto);

export default router;
