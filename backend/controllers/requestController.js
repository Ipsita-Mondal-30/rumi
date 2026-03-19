import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { calculateMatch } from '../services/matchingService.js';

/**
 * POST /request/send
 * Body: { toUserId }
 */
export async function sendRequest(req, res) {
  try {
    const fromUserId = req.userId;
    const { toUserId } = req.body || {};
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
    if ((toUser.blockedUsers || []).some(id => id.toString() === fromUserId.toString())) {
      return res.status(403).json({ success: false, message: 'Cannot send request.' });
    }

    const existing = await Request.findOne({ fromUserId, toUserId });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Request already sent.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'Already connected.' });
      }
    }

    const doc = await Request.findOneAndUpdate(
      { fromUserId, toUserId },
      { $set: { status: 'pending', respondedAt: null } },
      { new: true, upsert: true }
    ).populate('toUserId', 'name age city photo profilePicture');

    // Auto-match: if the other user already liked you (pending reverse request),
    // mark both directions as accepted.
    const reversePending = await Request.findOne({
      fromUserId: toUserId,
      toUserId: fromUserId,
      status: 'pending',
    });

    if (reversePending) {
      await Promise.all([
        Request.findOneAndUpdate(
          { fromUserId, toUserId },
          { $set: { status: 'accepted', respondedAt: new Date() } },
          { new: true }
        ),
        Request.findOneAndUpdate(
          { fromUserId: toUserId, toUserId: fromUserId },
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
    const { toUserId } = req.body || {};
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

    const doc = await Request.findOneAndUpdate(
      { fromUserId, toUserId },
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
    const { requestId, fromUserId } = req.body || {};
    let query = { toUserId, status: 'pending' };
    if (requestId) query._id = requestId;
    else if (fromUserId) query.fromUserId = fromUserId;
    else {
      return res.status(400).json({ success: false, message: 'requestId or fromUserId required.' });
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
    const { requestId, fromUserId } = req.body || {};
    let query = { toUserId, status: 'pending' };
    if (requestId) query._id = requestId;
    else if (fromUserId) query.fromUserId = fromUserId;
    else {
      return res.status(400).json({ success: false, message: 'requestId or fromUserId required.' });
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

    const list = await Request.find({ toUserId: req.userId, status: 'pending' })
      .populate(
        'fromUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .sort({ createdAt: -1 })
      .lean();

    const enriched = list.map((r) => {
      const other = r.fromUserId || {};
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

    const list = await Request.find({ toUserId: req.userId, status: 'accepted' })
      .populate(
        'fromUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .sort({ createdAt: -1 })
      .lean();

    const enriched = list.map((r) => {
      const other = r.fromUserId || {};
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

    const list = await Request.find({ fromUserId: req.userId })
      .populate(
        'toUserId',
        'name age city photo profilePicture bio budgetRange profession lifestylePreferences'
      )
      .sort({ createdAt: -1 })
      .lean();

    const enriched = list.map((r) => {
      const other = r.toUserId || {};
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
