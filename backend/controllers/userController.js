import { User } from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TRUST_SCORE = {
  profileComplete: 15,
  profilePicture: 10,
  bio: 5,
  verificationUpload: 25,
  verificationApproved: 45,
};

function computeTrustScore(user) {
  let score = 0;
  if (user.profileCompleted) score += TRUST_SCORE.profileComplete;
  if (user.profilePicture) score += TRUST_SCORE.profilePicture;
  if (user.bio && user.bio.trim().length > 0) score += TRUST_SCORE.bio;
  const docs = user.verificationDocuments || [];
  const hasUpload = docs.some((d) => d.url);
  const allApproved = docs.length > 0 && docs.every((d) => d.status === 'approved');
  if (hasUpload) score += TRUST_SCORE.verificationUpload;
  if (allApproved) score += TRUST_SCORE.verificationApproved;
  return Math.min(100, score);
}

function getVerificationStatus(user) {
  const docs = user.verificationDocuments || [];
  if (docs.length === 0) return 'none';
  if (docs.some((d) => d.status === 'rejected')) return 'rejected';
  if (docs.every((d) => d.status === 'approved')) return 'verified';
  return 'pending';
}

export async function register(req, res) {
  try {
    const { email, phone } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user) {
      const { passwordHash, ...safe } = user.toObject();
      return res.status(200).json({ success: true, user: safe });
    }
    user = await User.create({
      email: email.trim().toLowerCase(),
      phone: phone || '',
    });
    const { passwordHash, ...safe } = user.toObject();
    return res.status(201).json({ success: true, user: safe });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

function validateProfile(body) {
  const errors = [];
  if (body.age != null && (body.age < 18 || body.age > 120)) {
    errors.push('Age must be between 18 and 120.');
  }
  const validGenders = ['male', 'female', 'non_binary', 'other', 'prefer_not_to_say', ''];
  if (body.gender != null && !validGenders.includes(body.gender)) {
    errors.push('Invalid gender.');
  }
  if (body.bio != null && body.bio.length > 500) {
    errors.push('Bio must be at most 500 characters.');
  }
  return errors;
}

export async function createProfile(req, res) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required.' });
    }
    const validationErrors = validateProfile(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }
    const update = {
      bio: req.body.bio,
      age: req.body.age,
      gender: req.body.gender,
      location: req.body.location,
      preferences: req.body.preferences,
      profileCompleted: true,
    };
    if (req.body.profilePicture != null) update.profilePicture = req.body.profilePicture;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.trustScore = computeTrustScore(user);
    user.verificationStatus = getVerificationStatus(user);
    await user.save();
    const { passwordHash, ...safe } = user.toObject();
    return res.status(201).json({ success: true, user: safe });
  } catch (err) {
    console.error('createProfile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.params.userId || req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required.' });
    }
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.params.userId || req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required.' });
    }
    const validationErrors = validateProfile(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }
    const allowed = [
      'bio', 'age', 'gender', 'location', 'preferences', 'profilePicture', 'profileCompleted',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.trustScore = computeTrustScore(user);
    user.verificationStatus = getVerificationStatus(user);
    await user.save();
    const { passwordHash, ...safe } = user.toObject();
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

export async function uploadProfilePicture(req, res) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required.' });
    }
    const fileUrl = req.file ? `/uploads/profile/${req.file.filename}` : null;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'File required.' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: fileUrl } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.trustScore = computeTrustScore(user);
    await user.save();
    const { passwordHash, ...safe } = user.toObject();
    return res.status(200).json({ success: true, user: safe });
  } catch (err) {
    console.error('uploadProfilePicture error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}

export async function uploadVerification(req, res) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required.' });
    }
    const type = (req.body.type || (req.file && req.file.fieldname) || 'aadhar').toLowerCase();
    if (!['aadhar', 'college_id'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be aadhar or college_id.' });
    }
    const fileUrl = req.file
      ? `/uploads/verification/${req.file.filename}`
      : req.body.url;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'File or url required.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const docs = user.verificationDocuments || [];
    const existing = docs.find((d) => d.type === type);
    const newDoc = {
      type,
      url: fileUrl,
      status: 'pending',
      uploadedAt: new Date(),
    };
    if (existing) {
      const idx = docs.findIndex((d) => d.type === type);
      docs[idx] = newDoc;
    } else {
      docs.push(newDoc);
    }
    user.verificationDocuments = docs;
    user.verificationStatus = getVerificationStatus(user);
    user.trustScore = computeTrustScore(user);
    await user.save();
    const { passwordHash, ...safe } = user.toObject();
    return res.status(201).json({ success: true, user: safe });
  } catch (err) {
    console.error('uploadVerification error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
}
