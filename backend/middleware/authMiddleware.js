import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rumi-jwt-secret-change-in-production';

/**
 * Verify JWT and attach user to req.user. Use for protected routes.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found.' });
        }
        req.user = user;
        req.userId = user._id;
        next();
      })
      .catch(() => res.status(401).json({ success: false, message: 'Invalid token.' }));
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth: if token present and valid, set req.user; otherwise continue without it.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId)
      .then((user) => {
        if (user) {
          req.user = user;
          req.userId = user._id;
        }
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function signToken(userId) {
  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

/** Short-lived JWT used only after OTP verification, before setting a new password. */
export function signPasswordResetToken(userId) {
  return jwt.sign(
    { userId: userId.toString(), purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function verifyPasswordResetToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.purpose !== 'password_reset' || !decoded.userId) {
    throw new Error('Invalid reset token.');
  }
  return decoded;
}
