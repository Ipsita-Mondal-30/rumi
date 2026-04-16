import mongoose from 'mongoose';

/**
 * Simple in-app notifications (no realtime).
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['request_received', 'request_accepted'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

