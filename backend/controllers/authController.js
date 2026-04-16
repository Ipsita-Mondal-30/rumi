import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import {
  signToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '../middleware/authMiddleware.js';

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 min

/**
 * POST /auth/register
 * Body: { email, password, name?, phone? }
 */
export async function register(req, res) {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name?.trim() || '',
      phone: phone?.trim() || '',
    });

    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.otpCode;
    delete safe.otpExpiresAt;
    return res.status(201).json({
      success: true,
      message: 'Registered successfully.',
      token,
      user: safe,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    let user = await User.findOne({ email: emailNorm });
    // Legacy docs may have mixed-case email before schema lowercase enforcement
    if (!user && email.trim()) {
      const safe = emailNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ email: new RegExp(`^${safe}$`, 'i') });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.accountStatus === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Contact support if you believe this is a mistake.',
      });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.otpCode;
    delete safe.otpExpiresAt;
    return res.json({
      success: true,
      token,
      user: safe,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/otp/send
 * Body: { email } — simulate sending OTP (store in DB for demo).
 */
export async function sendOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { otpCode: code, otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // In production: send code via SMS/email. For demo we don't send.
    return res.json({
      success: true,
      message: 'OTP sent. (Simulated: use /auth/otp/verify with the code from server logs in dev.)',
      expiresIn: OTP_EXPIRY_MS / 1000,
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/otp/verify
 * Body: { email, code }
 */
export async function verifyOtp(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: 'Email and OTP code required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.otpCode !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }

    await User.updateOne(
      { _id: user._id },
      { $unset: { otpCode: 1, otpExpiresAt: 1 }, $set: { 'verificationStatus.phoneVerified': true } }
    );
    const token = signToken(user._id);
    const updated = await User.findById(user._id).select('-passwordHash -otpCode -otpExpiresAt');
    return res.json({
      success: true,
      message: 'Phone verified.',
      token,
      user: updated?.toObject(),
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

function normalizeIdentifier(identifier) {
  return (identifier || '').trim();
}

async function findUserByEmailOrPhone(identifier) {
  const raw = normalizeIdentifier(identifier);
  if (!raw) return null;
  if (raw.includes('@')) {
    return User.findOne({ email: raw.toLowerCase() });
  }
  return User.findOne({ phone: raw });
}

/**
 * POST /auth/password-reset/request
 * Body: { email } — email or phone matching User.phone
 */
export async function requestPasswordReset(req, res) {
  try {
    let { email } = req.body || {};
    email = normalizeIdentifier(email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email or phone is required.' });
    }

    const user = await findUserByEmailOrPhone(email);
    if (!user || !user.passwordHash) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email or phone, or password sign-in is not enabled.',
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetOtp: code,
          passwordResetOtpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
      }
    );

    console.log(`[password-reset] OTP for ${user.email}: ${code}`);

    return res.json({
      success: true,
      message:
        'Reset code sent. (Demo: your 6-digit code is printed in the server console; use email delivery in production.)',
      expiresIn: OTP_EXPIRY_MS / 1000,
    });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/password-reset/verify-code
 * Body: { email, code } — identifier must match request step (email or phone)
 */
export async function verifyPasswordResetCode(req, res) {
  try {
    let { email, code } = req.body || {};
    email = normalizeIdentifier(email);
    code = (code || '').trim();
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email or phone and code are required.' });
    }

    const user = await findUserByEmailOrPhone(email);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const fresh = await User.findById(user._id).select(
      'passwordResetOtp passwordResetOtpExpiresAt'
    );
    if (!fresh?.passwordResetOtp || fresh.passwordResetOtp !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }
    if (!fresh.passwordResetOtpExpiresAt || fresh.passwordResetOtpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    await User.updateOne(
      { _id: user._id },
      { $unset: { passwordResetOtp: 1, passwordResetOtpExpiresAt: 1 } }
    );

    const resetToken = signPasswordResetToken(user._id);
    return res.json({
      success: true,
      message: 'Code verified. Choose a new password.',
      resetToken,
    });
  } catch (err) {
    console.error('verifyPasswordResetCode error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/password-reset/confirm
 * Body: { resetToken, newPassword }
 */
export async function confirmPasswordReset(req, res) {
  try {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken?.trim()) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    let decoded;
    try {
      decoded = verifyPasswordResetToken(resetToken.trim());
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset session.' });
    }

    const userId = String(decoded.userId || '');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid reset session.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { passwordHash } },
      { new: true }
    );

    if (!user?.passwordHash) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const hashOk = await bcrypt.compare(newPassword, user.passwordHash);
    if (!hashOk) {
      console.error('confirmPasswordReset: stored hash does not verify for user', userId);
      return res.status(500).json({
        success: false,
        message: 'Could not save new password. Try again or request a new reset code.',
      });
    }

    return res.json({
      success: true,
      message: 'Password updated. You can sign in with your new password.',
    });
  } catch (err) {
    console.error('confirmPasswordReset error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /auth/google
 * Body: { credential } where credential is a Google ID token (JWT).
 */
export async function googleAuth(req, res) {
  try {
    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }

    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) {
      return res.status(500).json({
        success: false,
        message: 'Server is missing GOOGLE_CLIENT_ID configuration.',
      });
    }

    const client = new OAuth2Client(audience);
    const ticket = await client.verifyIdToken({ idToken: credential, audience });
    const payload = ticket.getPayload();

    const email = (payload?.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is missing.' });
    }
    if (payload?.email_verified === false) {
      return res.status(401).json({ success: false, message: 'Google email is not verified.' });
    }

    const googleSub = payload?.sub ? String(payload.sub) : '';
    const name = payload?.name ? String(payload.name) : '';
    const picture = payload?.picture ? String(payload.picture) : null;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        authProvider: 'google',
        googleSub,
        googlePicture: picture,
      });
    } else {
      // Link/refresh google profile info (safe even for password users).
      const updates = {};
      if (!user.googleSub && googleSub) updates.googleSub = googleSub;
      if (picture && user.googlePicture !== picture) updates.googlePicture = picture;
      if (!user.name && name) updates.name = name;
      if (user.authProvider !== 'google' && googleSub) updates.authProvider = 'google';
      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    if (user.accountStatus === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Contact support if you believe this is a mistake.',
      });
    }

    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.otpCode;
    delete safe.otpExpiresAt;
    delete safe.passwordResetOtp;
    delete safe.passwordResetOtpExpiresAt;

    return res.json({
      success: true,
      token,
      user: safe,
    });
  } catch (err) {
    console.error('googleAuth error:', err);
    return res.status(401).json({ success: false, message: 'Google authentication failed.' });
  }
}
