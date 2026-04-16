import { Notification } from '../models/Notification.js';

/**
 * GET /notification
 * Query: unreadOnly=true|false, limit, page
 */
export async function listNotifications(req, res) {
  try {
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;

    const q = { userId: req.userId };
    if (unreadOnly) q.read = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(q),
      Notification.countDocuments({ userId: req.userId, read: false }),
    ]);

    return res.json({
      success: true,
      notifications: items,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('listNotifications error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** PATCH /notification/:id/read */
export async function markNotificationRead(req, res) {
  try {
    const id = req.params.id;
    const doc = await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.json({ success: true, notification: doc.toObject() });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** PATCH /notification/read-all */
export async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

