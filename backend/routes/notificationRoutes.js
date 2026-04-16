import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authenticate, notificationController.listNotifications);
router.patch('/read-all', authenticate, notificationController.markAllRead);
router.patch('/:id/read', authenticate, notificationController.markNotificationRead);

export default router;

