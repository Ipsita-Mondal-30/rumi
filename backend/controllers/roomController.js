import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Request } from '../models/Request.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

import { calculateRoomCompatibility, calculateMatchScore } from '../services/roomMatchingService.js';

const parseBool = (v) => v === true || v === 'true' || v === '1' || v === 1;

const isCloudinaryConfigured = () => {
  return Boolean(
    String(process.env.CLOUDINARY_CLOUD_NAME ?? '').trim() &&
      String(process.env.CLOUDINARY_API_KEY ?? '').trim() &&
      String(process.env.CLOUDINARY_API_SECRET ?? '').trim()
  );
};

const toUploadUrl = (filePath) => {
  const filename = path.basename(filePath);
  return `/uploads/${filename}`;
};

/**
 * POST /rooms
 * Create a room listing for current user.
 */
export async function createRoom(req, res) {
  try {
    const ownerUserId = req.userId;

    const body = req.body || {};

    const uploadedPhotos = req.files?.photos ?? [];
    const uploadedVideo = (req.files?.video ?? [])[0] ?? null;

    let photoUrls = Array.isArray(body.photoUrls)
      ? body.photoUrls
      : typeof body.photoUrls === 'string'
        ? body.photoUrls.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    let videoUrl = body.videoUrl ?? '';

    // If files are uploaded, prefer Cloudinary URLs.
    if (uploadedPhotos.length > 0 || uploadedVideo) {
      if (isCloudinaryConfigured()) {
        const uploadTempFile = async (file, resourceType) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: resourceType,
              folder: 'rooms',
            });

            // Best-effort cleanup for temp files only when cloudinary succeeds.
            fs.promises.unlink(file.path).catch(() => {});
            return result?.secure_url || '';
          } catch {
            // If Cloudinary fails (missing creds, downtime, etc), fall back
            // to local uploads so room creation doesn't crash.
            return toUploadUrl(file.path);
          }
        };

        const uploadedPhotoUrls = await Promise.all(
          uploadedPhotos.map((file) => uploadTempFile(file, 'image'))
        );
        photoUrls = uploadedPhotoUrls.filter(Boolean);

        if (uploadedVideo) {
          videoUrl = await uploadTempFile(uploadedVideo, 'video');
        }
      } else {
        // Fallback: keep local uploads and serve via /uploads static route.
        photoUrls = uploadedPhotos.map((f) => toUploadUrl(f.path));
        if (uploadedVideo) videoUrl = toUploadUrl(uploadedVideo.path);
      }
    }

    const room = await Room.create({
      ownerUserId,
      status: 'paused',
      propertyType: body.propertyType ?? '',
      roomType: body.roomType ?? '',
      location: {
        city: body.city ?? body?.location?.city ?? '',
        area: body.area ?? body?.location?.area ?? '',
        address: body.address ?? body?.location?.address ?? '',
      },
      monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : Number(0),
      securityDeposit: body.securityDeposit ?? 0,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      leaseDurationMonths: body.leaseDurationMonths ?? null,

      furnishingStatus: body.furnishingStatus ?? '',
      attachedBathroom: parseBool(body.attachedBathroom),
      amenities: {
        wifi: parseBool(body.wifi),
        ac: parseBool(body.ac),
        washingMachine: parseBool(body.washingMachine),
        kitchenAccess: parseBool(body.kitchenAccess),
        parking: parseBool(body.parking),
        powerBackup: parseBool(body.powerBackup),
      },
      bedAvailability: body.bedAvailability ?? null,

      flatmatePreferences: {
        preferredGender: body.preferredGender ?? '',
        ageMin: body.ageMin ?? null,
        ageMax: body.ageMax ?? null,
        occupation: body.occupation ?? '',
        smokingAllowed: body.smokingAllowed ?? '',
        drinkingAllowed: body.drinkingAllowed ?? '',
        petsAllowed: body.petsAllowed ?? '',
        foodPreference: body.foodPreference ?? '',
        sleepSchedule: body.sleepSchedule ?? '',
        cleanlinessLevel: body.cleanlinessLevel ?? '',
        socialLevel: body.socialLevel ?? '',
      },

      photoUrls,
      videoUrl,

      roomDescription: body.roomDescription ?? body.description ?? '',

      contactPreferences: {
        phoneVisibility: parseBool(body.phoneVisibility),
        chatOption: body.chatOption === undefined ? true : parseBool(body.chatOption),
        preferredContactTime: body.preferredContactTime ?? '',
      },
    });

    return res.json({ success: true, room });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createRoom error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * GET /rooms/recommended
 * Recommend rooms for users looking for a room.
 *
 * Matching strategy:
 * - Pre-filter candidates by city + within-budget overlap (for performance)
 * - Compute compatibility score using `calculateMatchScore(user, listing)`
 * - Sort by score desc and return top N
 * - If there are no strong matches, return trending listings instead
 */
export async function getRecommendedRooms(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      'city location age gender profession budgetRange lifestylePreferences'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const city = (user.city || user.location?.city || '').toString().trim();
    const min = user.budgetRange?.min ?? 0;
    const max = user.budgetRange?.max ?? 0;

    const matchCity = city ? { 'location.city': city } : {};

    // Only show active listings. Keep city filtering for performance.
    // We intentionally do not enforce rent overlap here so we can show "all offer rooms"
    // and compute compatibility percentage (including "Within budget") in the scorer.
    const baseQuery = { ...matchCity, status: 'active' };

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 60);
    const candidateLimit = Math.min(Math.max(limit * 5, 30), 180);

    const buildTags = (room, score) => {
      const withinBudget = max > 0 && min > 0 && Number(room.monthlyRent ?? 0) >= min && Number(room.monthlyRent ?? 0) <= max;
      const inCity = city && String(room?.location?.city ?? '').toString().trim().toLowerCase() === String(city).toLowerCase();
      const tags = [];
      if (score >= 80) tags.push('Good match');
      if (withinBudget) tags.push('Within budget');
      if (inCity) tags.push('In your city');
      return tags;
    };

    let candidates = await Room.find(baseQuery)
      .select('ownerUserId propertyType roomType location monthlyRent photoUrls roomDescription flatmatePreferences status viewsCount createdAt')
      .sort({ createdAt: -1 })
      .limit(candidateLimit)
      .lean();

    // Fallback: if no active rooms match the user's city, search across all active rooms.
    if (!candidates.length && city) {
      candidates = await Room.find({ status: 'active' })
        .select('ownerUserId propertyType roomType location monthlyRent photoUrls roomDescription flatmatePreferences status viewsCount createdAt')
        .sort({ createdAt: -1 })
        .limit(candidateLimit)
        .lean();
    }

    const scored = candidates.map((room) => {
      const score = calculateMatchScore(user?.toObject?.() ?? user, room);
      return {
        ...room,
        compatibility: score,
        matchScore: score,
        coverUrl: room?.photoUrls?.[0] || '',
        tags: buildTags(room, score),
      };
    });

    scored.sort((a, b) => b.compatibility - a.compatibility);

    const strongThreshold = 70;
    const strong = scored.filter((r) => r.compatibility >= strongThreshold);

    // If no strong matches, return "trending" (viewsCount-like ordering) but still include compatibility percentage.
    const list = strong.length ? strong : scored;

    const withTrendingTag = list.map((r) => {
      if (r.compatibility >= strongThreshold) return r;
      return {
        ...r,
        tags: Array.isArray(r.tags) && r.tags.length > 0 ? [...r.tags, 'Trending'] : ['Trending'],
      };
    });

    withTrendingTag.sort((a, b) => b.compatibility - a.compatibility);
    return res.json({ success: true, rooms: withTrendingTag.slice(0, limit) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getRecommendedRooms error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * GET /rooms/mine
 * Returns rooms created by the current user, including computed listing metrics.
 */
export async function getMyRooms(req, res) {
  try {
    const userId = req.userId;

    const rooms = await Room.find({ ownerUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!rooms.length) {
      return res.json({ success: true, rooms: [] });
    }

    // Pull all room-scoped requests for owned rooms in a single query.
    const roomIds = rooms.map((r) => r._id);
    const requests = await Request.find({
      toUserId: userId,
      roomId: { $in: roomIds },
    })
      .populate(
        'fromUserId',
        'name age photo profilePicture bio lifestylePreferences profession city budgetRange'
      )
      .lean();

    const requestsByRoomId = new Map();
    for (const r of requests) {
      const rid = r.roomId?.toString?.() || String(r.roomId);
      const list = requestsByRoomId.get(rid) || [];
      list.push(r);
      requestsByRoomId.set(rid, list);
    }

    const enrichedRooms = rooms.map((room) => {
      const rid = room._id.toString();
      const list = requestsByRoomId.get(rid) || [];

      const incomingPending = list.filter((r) => r.status === 'pending').length;
      const totalRequests = list.length;
      const acceptedRequests = list.filter((r) => r.status === 'accepted').length;

      const compatibilityScores = list.map((r) => {
        const otherUser = r.fromUserId || {};
        return calculateRoomCompatibility(room, otherUser);
      });
      const avgCompatibility =
        compatibilityScores.length > 0
          ? Math.round(compatibilityScores.reduce((a, b) => a + b, 0) / compatibilityScores.length)
          : 0;

      const acceptanceRate =
        totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0;

      return {
        ...room,
        coverUrl: room.photoUrls?.[0] || '',
        incomingRequestsCount: incomingPending,
        totalRequests,
        acceptanceRate,
        avgCompatibilityScore: avgCompatibility,
      };
    });

    return res.json({ success: true, rooms: enrichedRooms });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getMyRooms error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * PATCH /rooms/:roomId/status
 * Body: { status: 'active' | 'paused' | 'rented' }
 */
export async function updateRoomStatus(req, res) {
  try {
    const userId = req.userId;
    const roomId = req.params?.roomId;
    const { status } = req.body || {};

    if (!roomId) return res.status(400).json({ success: false, message: 'roomId required.' });
    if (!status) return res.status(400).json({ success: false, message: 'status required.' });

    const room = await Room.findOne({ _id: roomId, ownerUserId: userId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    if (!['active', 'paused', 'rented'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    room.status = status;
    await room.save();

    return res.json({ success: true, room });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('updateRoomStatus error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * POST /rooms/:roomId/view
 * Increments viewsCount for the room.
 */
export async function incrementRoomView(req, res) {
  try {
    // Any authenticated user can increment a room view.
    // (If you want to restrict this to the non-owner only, add a check here.)
    const _userId = req.userId;
    const roomId = req.params?.roomId;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId required.' });

    const room = await Room.findOne({ _id: roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    room.viewsCount += 1;
    await room.save();

    return res.json({ success: true, viewsCount: room.viewsCount, room });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('incrementRoomView error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * PUT /rooms/:roomId
 * Updates a room listing. Supports optional media uploads.
 */
export async function updateRoom(req, res) {
  try {
    const userId = req.userId;
    const roomId = req.params?.roomId;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId required.' });

    const room = await Room.findOne({ _id: roomId, ownerUserId: userId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    const body = req.body || {};
    const uploadedPhotos = req.files?.photos ?? [];
    const uploadedVideo = (req.files?.video ?? [])[0] ?? null;

    const parseMaybeArrayUrls = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        return v.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    let photoUrls = parseMaybeArrayUrls(body.photoUrls);
    let videoUrl = body.videoUrl ?? undefined;

    // If files are uploaded, prefer Cloudinary URLs and replace existing media.
    if (uploadedPhotos.length > 0 || uploadedVideo) {
      if (isCloudinaryConfigured()) {
        const uploadTempFile = async (file, resourceType) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: resourceType,
              folder: 'rooms',
            });

            fs.promises.unlink(file.path).catch(() => {});
            return result?.secure_url || '';
          } catch {
            return toUploadUrl(file.path);
          }
        };

        const uploadedPhotoUrls = await Promise.all(
          uploadedPhotos.map((file) => uploadTempFile(file, 'image'))
        );
        if (uploadedPhotoUrls.length > 0) photoUrls = uploadedPhotoUrls.filter(Boolean);

        if (uploadedVideo) {
          videoUrl = await uploadTempFile(uploadedVideo, 'video');
        }
      } else {
        // Fallback: update to local upload URLs.
        photoUrls = uploadedPhotos.map((f) => toUploadUrl(f.path));
        if (uploadedVideo) videoUrl = toUploadUrl(uploadedVideo.path);
      }
    }

    // Update fields (only apply if provided; leave others unchanged).
    if (body.propertyType !== undefined) room.propertyType = body.propertyType ?? '';
    if (body.roomType !== undefined) room.roomType = body.roomType ?? '';

    if (body.city !== undefined) room.location.city = body.city ?? '';
    if (body.area !== undefined) room.location.area = body.area ?? '';
    if (body.address !== undefined) room.location.address = body.address ?? '';

    if (body.monthlyRent !== undefined && body.monthlyRent !== '') {
      room.monthlyRent = Number(body.monthlyRent);
    }
    if (body.securityDeposit !== undefined) room.securityDeposit = Number(body.securityDeposit ?? 0);

    if (body.availableFrom !== undefined) {
      room.availableFrom = body.availableFrom ? new Date(body.availableFrom) : null;
    }
    if (body.leaseDurationMonths !== undefined) {
      room.leaseDurationMonths = body.leaseDurationMonths === '' ? null : Number(body.leaseDurationMonths);
    }

    if (body.furnishingStatus !== undefined) room.furnishingStatus = body.furnishingStatus ?? '';

    if (body.attachedBathroom !== undefined) room.attachedBathroom = parseBool(body.attachedBathroom);

    // Amenities (booleans come as string values in multipart forms).
    if (body.wifi !== undefined) room.amenities.wifi = parseBool(body.wifi);
    if (body.ac !== undefined) room.amenities.ac = parseBool(body.ac);
    if (body.washingMachine !== undefined) room.amenities.washingMachine = parseBool(body.washingMachine);
    if (body.kitchenAccess !== undefined) room.amenities.kitchenAccess = parseBool(body.kitchenAccess);
    if (body.parking !== undefined) room.amenities.parking = parseBool(body.parking);
    if (body.powerBackup !== undefined) room.amenities.powerBackup = parseBool(body.powerBackup);

    if (body.bedAvailability !== undefined) {
      room.bedAvailability = body.bedAvailability === '' ? null : Number(body.bedAvailability);
    }

    // Flatmate preferences
    if (body.preferredGender !== undefined) room.flatmatePreferences.preferredGender = body.preferredGender ?? '';
    if (body.ageMin !== undefined) room.flatmatePreferences.ageMin = body.ageMin === '' ? null : Number(body.ageMin);
    if (body.ageMax !== undefined) room.flatmatePreferences.ageMax = body.ageMax === '' ? null : Number(body.ageMax);
    if (body.occupation !== undefined) room.flatmatePreferences.occupation = body.occupation ?? '';
    if (body.smokingAllowed !== undefined) room.flatmatePreferences.smokingAllowed = body.smokingAllowed ?? '';
    if (body.drinkingAllowed !== undefined) room.flatmatePreferences.drinkingAllowed = body.drinkingAllowed ?? '';
    if (body.petsAllowed !== undefined) room.flatmatePreferences.petsAllowed = body.petsAllowed ?? '';
    if (body.foodPreference !== undefined) room.flatmatePreferences.foodPreference = body.foodPreference ?? '';
    if (body.sleepSchedule !== undefined) room.flatmatePreferences.sleepSchedule = body.sleepSchedule ?? '';
    if (body.cleanlinessLevel !== undefined) room.flatmatePreferences.cleanlinessLevel = body.cleanlinessLevel ?? '';
    if (body.socialLevel !== undefined) room.flatmatePreferences.socialLevel = body.socialLevel ?? '';

    if (photoUrls.length > 0) room.photoUrls = photoUrls;
    if (videoUrl !== undefined) room.videoUrl = videoUrl ?? '';

    if (body.roomDescription !== undefined) room.roomDescription = body.roomDescription ?? '';

    if (body.phoneVisibility !== undefined) room.contactPreferences.phoneVisibility = parseBool(body.phoneVisibility);
    if (body.chatOption !== undefined) room.contactPreferences.chatOption = parseBool(body.chatOption);
    if (body.preferredContactTime !== undefined) room.contactPreferences.preferredContactTime = body.preferredContactTime ?? '';

    await room.save();
    return res.json({ success: true, room });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('updateRoom error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * DELETE /rooms/:roomId
 */
export async function deleteRoom(req, res) {
  try {
    const userId = req.userId;
    const roomId = req.params?.roomId;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId required.' });

    const room = await Room.findOne({ _id: roomId, ownerUserId: userId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    await Promise.all([
      Request.deleteMany({ roomId: room._id }),
      Room.deleteOne({ _id: room._id }),
    ]);

    // Note: we intentionally leave Message cleanup for the room-chat flow task.
    // Messages can be large; cleaning later avoids slowing down this request.

    return res.json({ success: true, message: 'Room deleted.' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('deleteRoom error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

/**
 * GET /rooms/:roomId/suggestions
 * Returns users looking for rooms that match the listing preferences.
 */
export async function getRoomSuggestions(req, res) {
  try {
    const userId = req.userId;
    const roomId = req.params?.roomId;
    const limit = Math.min(parseInt(req.query?.limit, 10) || 10, 30);

    if (!roomId) return res.status(400).json({ success: false, message: 'roomId required.' });

    const room = await Room.findById(roomId).lean();
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    if (room.ownerUserId?.toString?.() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not allowed for this room.' });
    }

    // Only show users currently searching for a room.
    const candidates = await User.find({
      intent: 'find',
      profileCompleted: true,
      _id: { $ne: userId },
    })
      .select('name age photo profilePicture bio city profession lifestylePreferences budgetRange gender')
      .lean();

    if (!candidates.length) return res.json({ success: true, suggestions: [] });

    const candidateIds = candidates.map((u) => u._id);

    // Exclude users who already have a pending/accepted request for this room.
    const existing = await Request.find({
      roomId: room._id,
      toUserId: userId,
      fromUserId: { $in: candidateIds },
      status: { $in: ['pending', 'accepted'] },
    })
      .select('fromUserId')
      .lean();

    const existingSet = new Set(existing.map((r) => r.fromUserId?.toString?.() || String(r.fromUserId)));

    const scored = candidates
      .filter((u) => !existingSet.has(u._id.toString()))
      .map((u) => ({
        userId: u._id.toString(),
        name: u.name,
        age: u.age ?? '',
        image: u.photo || u.profilePicture || '',
        bio: u.bio || '',
        compatibility: calculateRoomCompatibility(room, u),
      }))
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, limit);

    return res.json({ success: true, suggestions: scored });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getRoomSuggestions error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
}

