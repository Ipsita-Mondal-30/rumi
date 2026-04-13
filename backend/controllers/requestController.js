import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { calculateMatch } from '../services/matchingService.js';
import { Room } from '../models/Room.js';
import { calculateRoomCompatibility } from '../services/roomMatchingService.js';

/**
 * POST /request/send
 * Body: { toUserId }
 */
export async function sendRequest(req, res) {
  try {
    const fromUserId = req.userId;
    const { toUserId, roomId } = req.body || {};
    if (!toUserId) {
      return res.status(400).json({ success: false, message: 'toUserId required.' });
    }
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself.' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let room = null;
    const roomIdStr = roomId ? String(roomId) : null;
    if (roomIdStr) {
      room = await Room.findById(roomIdStr);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
      // Listing owner sends the invite; the room must belong to the sender (fromUserId).
      if (room.ownerUserId?.toString?.() !== fromUserId.toString()) {
        return res.status(403).json({ success: false, message: 'You can only invite using your own listing.' });
      }
    }
    if ((toUser.blockedUsers || []).some(id => id.toString() === fromUserId.toString())) {
      return res.status(403).json({ success: false, message: 'Cannot send request.' });
    }

    const existing = await Request.findOne({
      fromUserId,
      toUserId,
      roomId: roomIdStr || null,
    });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Request already sent.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'Already connected.' });
      }
    }

    const doc = await Request.findOneAndUpdate(
      { fromUserId, toUserId, roomId: roomIdStr || null },
      { $set: { status: 'pending', respondedAt: null } },
      { new: true, upsert: true }
    ).populate('toUserId', 'name age city photo profilePicture');

    // Auto-match: if the other user already liked you (pending reverse request),
    // mark both directions as accepted.
    const reversePending = await Request.findOne({
      fromUserId: toUserId,
      toUserId: fromUserId,
      status: 'pending',
      roomId: roomIdStr || null,
    });

    if (reversePending) {
      await Promise.all([
        Request.findOneAndUpdate(
          { fromUserId, toUserId, roomId: roomIdStr || null },
          { $set: { status: 'accepted', respondedAt: new Date() } },
          { new: true }
        ),
        Request.findOneAndUpdate(
          { fromUserId: toUserId, toUserId: fromUserId, roomId: roomIdStr || null },
          { $set: { status: 'accepted', respondedAt: new Date() } },
          { new: true }
        ),
      ]);

      return res.status(201).json({
        success: true,
        message: 'It\'s a match! Connection accepted.',
        request: doc.toObject(),
        matched: true,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Request sent.',
      request: doc.toObject(),
      matched: false,
    });
  } catch (err) {
    console.error('sendRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /request/pass
 * Body: { toUserId }
 * Marks a swipe-left / pass decision by creating/updating a rejected request (from -> to).
 */
export async function passRequest(req, res) {
  try {
    const fromUserId = req.userId;
    const { toUserId, roomId } = req.body || {};
    if (!toUserId) {
      return res.status(400).json({ success: false, message: 'toUserId required.' });
    }
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot pass yourself.' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if ((toUser.blockedUsers || []).some((id) => id.toString() === fromUserId.toString())) {
      return res.status(403).json({ success: false, message: 'Cannot pass request.' });
    }

    const roomIdStr = roomId ? String(roomId) : null;

    // If this is a room-scoped request, ensure the room belongs to the recipient.
    if (roomIdStr) {
      const room = await Room.findById(roomIdStr);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
      if (room.ownerUserId?.toString?.() !== fromUserId.toString()) {
        return res.status(403).json({ success: false, message: 'You can only pass using your own listing context.' });
      }
    }

    const doc = await Request.findOneAndUpdate(
      { fromUserId, toUserId, roomId: roomIdStr || null },
      { $set: { status: 'rejected', respondedAt: new Date() } },
      { new: true, upsert: true }
    ).populate('toUserId', 'name age city photo profilePicture');

    return res.status(201).json({
      success: true,
      message: 'Profile passed.',
      request: doc?.toObject?.() ?? doc,
    });
  } catch (err) {
    console.error('passRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /request/accept
 * Body: { requestId } or { fromUserId }
 */
export async function acceptRequest(req, res) {
  try {
    const toUserId = req.userId;
    const { requestId, fromUserId, roomId } = req.body || {};
    let query = { toUserId, status: 'pending' };
    if (requestId) query._id = requestId;
    else if (fromUserId) query.fromUserId = fromUserId;
    else {
      return res.status(400).json({ success: false, message: 'requestId or fromUserId required.' });
    }

    if (roomId && !requestId) {
      query.roomId = String(roomId) || null;
    }

    const doc = await Request.findOneAndUpdate(
      query,
      { $set: { status: 'accepted', respondedAt: new Date() } },
      { new: true }
    ).populate('fromUserId', 'name age city photo profilePicture');
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    return res.json({
      success: true,
      message: 'Request accepted.',
      request: doc.toObject(),
    });
  } catch (err) {
    console.error('acceptRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /request/reject
 * Body: { requestId } or { fromUserId }
 */
export async function rejectRequest(req, res) {
  try {
    const toUserId = req.userId;
    const { requestId, fromUserId, roomId } = req.body || {};
    let query = { toUserId, status: 'pending' };
    if (requestId) query._id = requestId;
    else if (fromUserId) query.fromUserId = fromUserId;
    else {
      return res.status(400).json({ success: false, message: 'requestId or fromUserId required.' });
    }

    if (roomId && !requestId) {
      query.roomId = String(roomId) || null;
    }

    const doc = await Request.findOneAndUpdate(
      query,
      { $set: { status: 'rejected', respondedAt: new Date() } },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    return res.json({
      success: true,
      message: 'Request rejected.',
      request: doc.toObject(),
    });
  } catch (err) {
    console.error('rejectRequest error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * GET /request/received
 * List requests received by current user (pending).
 */
export async function receivedRequests(req, res) {
  try {
    const currentUser = await User.findById(req.userId).select(
      'city profession budgetRange lifestylePreferences location'
    );

    const roomId = req.query?.roomId ? String(req.query.roomId) : null;
    const roomFilter = roomId ? { roomId: roomId } : {};

    const list = await Request.find({
      toUserId: req.userId,
      status: 'pending',
      ...roomFilter,
    })
      .populate(
        'fromUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .populate('roomId', 'propertyType monthlyRent location coverUrl ownerUserId status')
      .sort({ createdAt: -1 })
      .lean();

    let room = null;
    if (roomId) {
      const r = await Room.findById(roomId).lean();
      if (!r || r.ownerUserId?.toString?.() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not allowed for this room.' });
      }
      room = r;
    }

    const roomDocIds = [
      ...new Set(list.map((x) => x.roomId?._id || x.roomId).filter(Boolean).map((id) => String(id))),
    ];
    const roomDocs = roomDocIds.length ? await Room.find({ _id: { $in: roomDocIds } }).lean() : [];
    const roomById = new Map(roomDocs.map((doc) => [String(doc._id), doc]));

    const enriched = list.map((r) => {
      const other = r.fromUserId || {};

      if (room) {
        const compatibility = calculateRoomCompatibility(room, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const scopedRoomId = r.roomId?._id || r.roomId;
      if (scopedRoomId && roomById.has(String(scopedRoomId))) {
        const rm = roomById.get(String(scopedRoomId));
        const compatibility = calculateRoomCompatibility(rm, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const { matchScore, reasons } = calculateMatch(currentUser?.toObject?.() || currentUser, other);
      return {
        ...r,
        matchScore,
        match: matchScore,
        reasons,
        compatibility: matchScore,
      };
    });

    return res.json({ success: true, requests: enriched });
  } catch (err) {
    console.error('receivedRequests error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * GET /request/received/accepted
 * List accepted requests received by current user.
 */
export async function receivedAcceptedRequests(req, res) {
  try {
    const currentUser = await User.findById(req.userId).select(
      'city profession budgetRange lifestylePreferences location'
    );

    const roomId = req.query?.roomId ? String(req.query.roomId) : null;
    const roomFilter = roomId ? { roomId: roomId } : {};

    const list = await Request.find({
      toUserId: req.userId,
      status: 'accepted',
      ...roomFilter,
    })
      .populate(
        'fromUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .populate('roomId', 'propertyType monthlyRent location coverUrl ownerUserId status')
      .sort({ createdAt: -1 })
      .lean();

    let room = null;
    if (roomId) {
      const r = await Room.findById(roomId).lean();
      if (!r || r.ownerUserId?.toString?.() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not allowed for this room.' });
      }
      room = r;
    }

    const roomDocIds = [
      ...new Set(list.map((x) => x.roomId?._id || x.roomId).filter(Boolean).map((id) => String(id))),
    ];
    const roomDocs = roomDocIds.length ? await Room.find({ _id: { $in: roomDocIds } }).lean() : [];
    const roomById = new Map(roomDocs.map((doc) => [String(doc._id), doc]));

    const enriched = list.map((r) => {
      const other = r.fromUserId || {};

      if (room) {
        const compatibility = calculateRoomCompatibility(room, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const scopedRoomId = r.roomId?._id || r.roomId;
      if (scopedRoomId && roomById.has(String(scopedRoomId))) {
        const rm = roomById.get(String(scopedRoomId));
        const compatibility = calculateRoomCompatibility(rm, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const { matchScore, reasons } = calculateMatch(currentUser?.toObject?.() || currentUser, other);
      return {
        ...r,
        matchScore,
        match: matchScore,
        reasons,
        compatibility: matchScore,
      };
    });

    return res.json({ success: true, requests: enriched });
  } catch (err) {
    console.error('receivedAcceptedRequests error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * GET /request/sent
 * List requests sent by current user.
 */
export async function sentRequests(req, res) {
  try {
    const currentUser = await User.findById(req.userId).select(
      'city profession budgetRange lifestylePreferences location'
    );

    const roomId = req.query?.roomId ? String(req.query.roomId) : null;
    const roomFilter = roomId ? { roomId: roomId } : {};

    const list = await Request.find({
      fromUserId: req.userId,
      ...roomFilter,
    })
      .populate(
        'toUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .populate('roomId', 'propertyType monthlyRent location coverUrl ownerUserId status')
      .sort({ createdAt: -1 })
      .lean();

    let room = null;
    if (roomId) {
      const r = await Room.findById(roomId).lean();
      room = r && r.ownerUserId?.toString?.() === req.userId.toString() ? r : null;
    }

    const roomDocIds = [
      ...new Set(list.map((x) => x.roomId?._id || x.roomId).filter(Boolean).map((id) => String(id))),
    ];
    const roomDocs = roomDocIds.length ? await Room.find({ _id: { $in: roomDocIds } }).lean() : [];
    const roomById = new Map(roomDocs.map((doc) => [String(doc._id), doc]));

    const enriched = list.map((r) => {
      const other = r.toUserId || {};

      if (room) {
        const compatibility = calculateRoomCompatibility(room, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const scopedRoomId = r.roomId?._id || r.roomId;
      if (scopedRoomId && roomById.has(String(scopedRoomId))) {
        const rm = roomById.get(String(scopedRoomId));
        const compatibility = calculateRoomCompatibility(rm, other);
        return {
          ...r,
          matchScore: compatibility,
          match: compatibility,
          compatibility,
        };
      }

      const { matchScore, reasons } = calculateMatch(currentUser?.toObject?.() || currentUser, other);
      return {
        ...r,
        matchScore,
        match: matchScore,
        reasons,
        compatibility: matchScore,
      };
    });

    return res.json({ success: true, requests: enriched });
  } catch (err) {
    console.error('sentRequests error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}
