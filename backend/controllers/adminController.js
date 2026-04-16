import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Request } from '../models/Request.js';
import { Report } from '../models/Report.js';
import { Message } from '../models/Message.js';
import { signAdminToken } from '../middleware/adminAuthMiddleware.js';
import { calculateMatch } from '../services/matchingService.js';

function prefsSummary(u) {
  const lp = u?.lifestylePreferences || {};
  const parts = [];
  if (lp.foodPreference) parts.push(`Food: ${lp.foodPreference}`);
  if (lp.sleepSchedule) parts.push(`Sleep: ${lp.sleepSchedule}`);
  if (lp.cleanlinessLevel) parts.push(`Clean: ${lp.cleanlinessLevel}`);
  if (lp.smoking) parts.push(`Smoke: ${lp.smoking}`);
  if (lp.drinking) parts.push(`Drink: ${lp.drinking}`);
  if (lp.pets) parts.push(`Pets: ${lp.pets}`);
  return parts.length ? parts.join(' · ') : '—';
}

function pagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function cascadeDeleteUser(userId) {
  const id = new mongoose.Types.ObjectId(userId);
  await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
  await Request.deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] });
  await Room.deleteMany({ ownerUserId: id });
  await Report.deleteMany({ $or: [{ reporterId: id }, { reportedUserId: id }] });
  await User.deleteOne({ _id: id });
}

/**
 * POST /api/admin/login
 * Bootstraps first admin from ADMIN_USERNAME + ADMIN_PASSWORD when DB has zero admins.
 */
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }
    const uname = username.trim().toLowerCase();
    const bootUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const bootPass = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await Admin.findOne({ username: uname });
    const adminCount = await Admin.countDocuments();

    if (!admin && adminCount === 0) {
      if (uname === bootUser && password === bootPass) {
        const passwordHash = await bcrypt.hash(password, 10);
        admin = await Admin.create({
          username: bootUser,
          passwordHash,
          displayName: 'Administrator',
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    } else if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    } else {
      const ok = await bcrypt.compare(password, admin.passwordHash);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const token = signAdminToken(admin._id);
    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/overview */
export async function adminOverview(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [totalUsers, activeUsers, roomsListed, matchesMade, pendingReports, pendingRooms] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: 'active', updatedAt: { $gte: thirtyDaysAgo } }),
        Room.countDocuments({ moderationStatus: { $ne: 'rejected' } }),
        Request.countDocuments({ status: 'accepted' }),
        Report.countDocuments({ status: 'open' }),
        Room.countDocuments({ moderationStatus: 'pending' }),
      ]);

    const since = new Date(Date.now() - 7 * 86400000);
    const signupAgg = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, signups: 0 });
    }
    const map = Object.fromEntries(signupAgg.map((x) => [x._id, x.count]));
    days.forEach((row) => {
      row.signups = map[row.date] || 0;
    });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        roomsListed,
        matchesMade,
        pendingReports,
        pendingRooms,
      },
      signupTrend: days,
    });
  } catch (err) {
    console.error('adminOverview error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/users */
export async function adminListUsers(req, res) {
  try {
    const { page, limit, skip } = pagination(req);
    const parts = [];
    if (req.query.city?.trim()) {
      const c = new RegExp(req.query.city.trim(), 'i');
      parts.push({ $or: [{ city: c }, { 'location.city': c }] });
    }
    if (req.query.foodPreference?.trim()) {
      parts.push({ 'lifestylePreferences.foodPreference': req.query.foodPreference.trim() });
    }
    if (req.query.accountStatus === 'active' || req.query.accountStatus === 'blocked') {
      parts.push({ accountStatus: req.query.accountStatus });
    }
    if (req.query.q?.trim()) {
      const s = new RegExp(req.query.q.trim(), 'i');
      parts.push({ $or: [{ name: s }, { email: s }] });
    }
    const q = parts.length ? { $and: parts } : {};

    const [items, total] = await Promise.all([
      User.find(q)
        .select('-passwordHash -otpCode -otpExpiresAt -passwordResetOtp -passwordResetOtpExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(q),
    ]);

    const users = items.map((u) => ({
      ...u,
      preferencesSummary: prefsSummary(u),
      cityDisplay: u.city || u.location?.city || '—',
    }));

    return res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('adminListUsers error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/users/:id */
export async function adminGetUser(req, res) {
  try {
    const u = await User.findById(req.params.id).select(
      '-passwordHash -otpCode -otpExpiresAt -passwordResetOtp -passwordResetOtpExpiresAt'
    );
    if (!u) return res.status(404).json({ success: false, message: 'User not found.' });
    const o = u.toObject();
    o.preferencesSummary = prefsSummary(o);
    o.cityDisplay = o.city || o.location?.city || '—';
    return res.json({ success: true, user: o });
  } catch (err) {
    console.error('adminGetUser error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** PATCH /api/admin/users/:id */
export async function adminUpdateUser(req, res) {
  try {
    const allowed = ['name', 'city', 'accountStatus', 'intent', 'bio'];
    const patch = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    if (patch.accountStatus && !['active', 'blocked'].includes(patch.accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid accountStatus.' });
    }
    const u = await User.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).select(
      '-passwordHash -otpCode -otpExpiresAt'
    );
    if (!u) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: u });
  } catch (err) {
    console.error('adminUpdateUser error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** DELETE /api/admin/users/:id */
export async function adminDeleteUser(req, res) {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'User not found.' });
    await cascadeDeleteUser(req.params.id);
    return res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('adminDeleteUser error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/rooms */
export async function adminListRooms(req, res) {
  try {
    const { page, limit, skip } = pagination(req);
    const q = {};
    if (req.query.moderationStatus) q.moderationStatus = req.query.moderationStatus;
    if (req.query.city?.trim()) {
      q['location.city'] = new RegExp(req.query.city.trim(), 'i');
    }

    const [rooms, total] = await Promise.all([
      Room.find(q)
        .populate('ownerUserId', 'name email city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Room.countDocuments(q),
    ]);

    const list = rooms.map((r) => ({
      ...r,
      ownerName: r.ownerUserId?.name || '—',
      ownerEmail: r.ownerUserId?.email || '—',
      city: r.location?.city || r.location?.area || '—',
      rent: r.monthlyRent,
      availability: r.availableFrom ? new Date(r.availableFrom).toISOString().slice(0, 10) : '—',
    }));

    return res.json({
      success: true,
      rooms: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('adminListRooms error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** PATCH /api/admin/rooms/:id — body: { moderationStatus: 'approved' | 'rejected' | 'pending' } */
export async function adminModerateRoom(req, res) {
  try {
    const { moderationStatus } = req.body || {};
    if (!['pending', 'approved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid moderationStatus.' });
    }
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: { moderationStatus } },
      { new: true }
    ).populate('ownerUserId', 'name email');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    return res.json({ success: true, room });
  } catch (err) {
    console.error('adminModerateRoom error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** DELETE /api/admin/rooms/:id */
export async function adminDeleteRoom(req, res) {
  try {
    const r = await Room.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Room not found.' });
    await Request.deleteMany({ roomId: r._id });
    return res.json({ success: true, message: 'Room deleted.' });
  } catch (err) {
    console.error('adminDeleteRoom error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/matches */
export async function adminListMatches(req, res) {
  try {
    const { page, limit, skip } = pagination(req);
    const filter = { status: 'accepted' };
    const [rows, total] = await Promise.all([
      Request.find(filter)
        .populate('fromUserId', 'name email city lifestylePreferences')
        .populate('toUserId', 'name email city lifestylePreferences')
        .populate('roomId', 'location monthlyRent')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);

    const matches = rows.map((r) => {
      let compatibilityScore = null;
      try {
        if (r.fromUserId && r.toUserId) {
          compatibilityScore = calculateMatch(r.fromUserId, r.toUserId).matchScore;
        }
      } catch {
        compatibilityScore = null;
      }
      return {
        _id: r._id,
        user1: r.fromUserId,
        user2: r.toUserId,
        roomId: r.roomId,
        compatibilityScore,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return res.json({
      success: true,
      matches,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('adminListMatches error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** DELETE /api/admin/matches/:id — removes accepted/pending request row */
export async function adminDeleteMatch(req, res) {
  try {
    const r = await Request.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Match / request not found.' });
    return res.json({ success: true, message: 'Match removed.' });
  } catch (err) {
    console.error('adminDeleteMatch error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/** GET /api/admin/reports */
export async function adminListReports(req, res) {
  try {
    const { page, limit, skip } = pagination(req);
    const q = {};
    if (req.query.status) q.status = req.query.status;

    const [reports, total] = await Promise.all([
      Report.find(q)
        .populate('reporterId', 'name email')
        .populate('reportedUserId', 'name email city accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(q),
    ]);

    return res.json({
      success: true,
      reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('adminListReports error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * PATCH /api/admin/reports/:id/handle
 * Body: { action: 'warn' | 'block' | 'delete' | 'dismiss', note?: string }
 */
export async function adminHandleReport(req, res) {
  try {
    const { action, note } = req.body || {};
    const allowed = ['warn', 'block', 'delete', 'dismiss'];
    if (!allowed.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (report.status !== 'open' && action !== 'dismiss') {
      return res.status(400).json({ success: false, message: 'Report is already closed.' });
    }

    const reportedId = report.reportedUserId;
    const adminId = req.adminId;

    if (action === 'dismiss') {
      report.status = 'dismissed';
      report.adminAction = 'dismissed';
      report.adminNote = note || '';
      report.handledAt = new Date();
      report.handledByAdminId = adminId;
      await report.save();
      return res.json({ success: true, report });
    }

    if (action === 'warn') {
      await User.findByIdAndUpdate(reportedId, { $inc: { adminWarnings: 1 } });
      report.status = 'resolved';
      report.adminAction = 'warned';
      report.adminNote = note || '';
      report.handledAt = new Date();
      report.handledByAdminId = adminId;
      await report.save();
      return res.json({ success: true, report });
    }

    if (action === 'block') {
      await User.findByIdAndUpdate(reportedId, { $set: { accountStatus: 'blocked' } });
      report.status = 'resolved';
      report.adminAction = 'blocked';
      report.adminNote = note || '';
      report.handledAt = new Date();
      report.handledByAdminId = adminId;
      await report.save();
      return res.json({ success: true, report });
    }

    if (action === 'delete') {
      report.status = 'resolved';
      report.adminAction = 'deleted';
      report.adminNote = note || '';
      report.handledAt = new Date();
      report.handledByAdminId = adminId;
      await report.save();
      await cascadeDeleteUser(reportedId);
      return res.json({ success: true, message: 'Reported user removed.', report });
    }

    return res.status(400).json({ success: false, message: 'Unhandled action.' });
  } catch (err) {
    console.error('adminHandleReport error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}
