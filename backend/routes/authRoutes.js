import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/otp/send', authController.sendOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/password-reset/request', authController.requestPasswordReset);
router.post('/password-reset/verify-code', authController.verifyPasswordResetCode);
router.post('/password-reset/confirm', authController.confirmPasswordReset);

export default router;
