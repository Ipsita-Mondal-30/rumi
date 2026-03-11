import { User } from '../models/User.js';
import { Request } from '../models/Request.js';
import { calculateMatch } from '../services/matchingService.js';
import { getCompatibilityExplanation } from '../services/geminiService.js';

/**
 * GET /matches
 * Returns compatible users sorted by match percentage (auth required).
 * Excludes blocked users and already accepted/pending requests.
 */
export async function getMatches(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const blocked = user.blockedUsers || [];
    const allOthers = await User.find({
      _id: { $nin: [userId, ...blocked] },
      profileCompleted: true,
    }).select('-passwordHash -otpCode -otpExpiresAt');

    const acceptedOrPending = await Request.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      status: { $in: ['accepted', 'pending'] },
    }).select('fromUserId toUserId').lean();
    const acceptedOrPendingWith = new Set([userId.toString()]);
    for (const r of acceptedOrPending) {
      acceptedOrPendingWith.add(r.fromUserId?.toString());
      acceptedOrPendingWith.add(r.toUserId?.toString());
    }

    const candidates = allOthers.filter(
      (u) => !acceptedOrPendingWith.has(u._id.toString())
    );

    const results = candidates.map((other) => {
      const { matchScore, reasons } = calculateMatch(user, other);
      return {
        user: other.toObject(),
        matchScore,
        reasons,
      };
    });

    results.sort((a, b) => b.matchScore - a.matchScore);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const list = results.slice(0, limit);

    return res.json({
      success: true,
      matches: list,
    });
  } catch (err) {
    console.error('getMatches error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * GET /matches/explain?userId=...
 * Returns match score + Gemini compatibility explanation for the current user and target user.
 */
export async function getMatchExplain(req, res) {
  try {
    const userId = req.userId;
    const targetId = req.query.userId;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'userId query required.' });
    }

    const [user, target] = await Promise.all([
      User.findById(userId).select('-passwordHash -otpCode -otpExpiresAt'),
      User.findById(targetId).select('-passwordHash -otpCode -otpExpiresAt'),
    ]);
    if (!user || !target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const matchResult = calculateMatch(user, target);
    const compatibilityExplanation = await getCompatibilityExplanation(
      user.toObject(),
      target.toObject(),
      matchResult
    );

    return res.json({
      success: true,
      matchScore: matchResult.matchScore,
      reasons: matchResult.reasons,
      compatibilityExplanation: compatibilityExplanation || undefined,
    });
  } catch (err) {
    console.error('getMatchExplain error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}
