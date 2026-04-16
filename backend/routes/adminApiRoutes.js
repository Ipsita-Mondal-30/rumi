import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuthMiddleware.js';
import {
  adminLogin,
  adminOverview,
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
  adminListRooms,
  adminModerateRoom,
  adminDeleteRoom,
  adminListMatches,
  adminDeleteMatch,
  adminListReports,
  adminHandleReport,
} from '../controllers/adminController.js';

/**
 * Admin REST API mounted at `/api` (e.g. POST /api/admin/login).
 * End-user routes stay on `/auth`, `/user`, etc.
 */
const router = Router();

// Public
router.post('/admin/login', adminLogin);

// Protected (JWT with role admin)
router.use(authenticateAdmin);
router.get('/admin/overview', adminOverview);

router.get('/admin/users', adminListUsers);
router.get('/admin/users/:id', adminGetUser);
router.patch('/admin/users/:id', adminUpdateUser);
router.delete('/admin/users/:id', adminDeleteUser);

router.get('/admin/rooms', adminListRooms);
router.patch('/admin/rooms/:id', adminModerateRoom);
router.delete('/admin/rooms/:id', adminDeleteRoom);

router.get('/admin/matches', adminListMatches);
router.delete('/admin/matches/:id', adminDeleteMatch);

router.get('/admin/reports', adminListReports);
router.patch('/admin/reports/:id/handle', adminHandleReport);

export default router;
