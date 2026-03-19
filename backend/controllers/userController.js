import { User } from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * GET /user/profile
 * Returns current user profile (auth required).
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -otpCode -otpExpiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: user.toObject() });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * PUT /user/profile
 * Update profile. Body can include: name, age, gender, city, profession, budgetRange, bio, photo, lifestylePreferences, verificationStatus.
 */
export async function updateProfile(req, res) {
  try {
    const allowed = [
      'name', 'age', 'gender', 'city', 'profession', 'budgetRange', 'bio', 'photo',
      'lifestylePreferences', 'verificationStatus', 'location', 'profilePicture', 'profileCompleted',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Frontend can validate, but enforce again here so bad inputs can't be saved.
    if (updates.name !== undefined) {
      const nameStr = String(updates.name).trim();
      const parts = nameStr ? nameStr.split(/\s+/).filter(Boolean) : [];
      if (!nameStr || parts.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name must include at least first name and last name.',
        });
      }
      updates.name = nameStr;
    }

    if (updates.age !== undefined) {
      const ageNum = Number(updates.age);
      if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 18 and 120.',
        });
      }
      updates.age = ageNum;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash -otpCode -otpExpiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: user.toObject() });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

/**
 * POST /user/profile/photo
 * Multipart form with field "photo" (image file). Updates user photo and profilePicture URLs.
 */
export async function uploadProfilePhoto(req, res) {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    const photoPath = '/uploads/' + req.file.filename;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { photo: photoPath, profilePicture: photoPath } },
      { new: true }
    ).select('-passwordHash -otpCode -otpExpiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: user.toObject() });
  } catch (err) {
    console.error('uploadProfilePhoto error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}
