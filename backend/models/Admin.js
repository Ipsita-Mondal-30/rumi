import mongoose from 'mongoose';

/**
 * Platform administrator (separate from end-user accounts).
 * First login can bootstrap from ADMIN_USERNAME / ADMIN_PASSWORD in .env when no admin exists.
 */
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema);
