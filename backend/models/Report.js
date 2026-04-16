import mongoose from 'mongoose';

/**
 * User report (fake profile, harassment, spam).
 */
const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['fake_profile', 'harassment', 'spam'],
      required: true,
    },
    description: { type: String, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    /** Last admin resolution (warn / block user / delete user / dismiss). */
    adminAction: {
      type: String,
      enum: ['none', 'warned', 'blocked', 'deleted', 'dismissed'],
      default: 'none',
    },
    adminNote: { type: String, default: '' },
    handledAt: { type: Date, default: null },
    handledByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ reporterId: 1, reportedUserId: 1 });

export const Report = mongoose.model('Report', reportSchema);
