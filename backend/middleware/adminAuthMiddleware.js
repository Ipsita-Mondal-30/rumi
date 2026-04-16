import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rumi-jwt-secret-change-in-production';

/** JWT for admin panel (separate claims from end-user tokens). */
export function signAdminToken(adminId) {
  return jwt.sign(
    { adminId: adminId.toString(), role: 'admin' },
    JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '2d' }
  );
}

/**
 * Require valid admin JWT (Bearer). Sets req.admin and req.adminId.
 */
export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' || !decoded.adminId) {
      return res.status(401).json({ success: false, message: 'Invalid admin token.' });
    }

    Admin.findById(decoded.adminId)
      .then((admin) => {
        if (!admin) {
          return res.status(401).json({ success: false, message: 'Admin not found.' });
        }
        req.admin = admin;
        req.adminId = admin._id;
        next();
      })
      .catch(() => res.status(401).json({ success: false, message: 'Invalid admin token.' }));
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token.' });
  }
}
