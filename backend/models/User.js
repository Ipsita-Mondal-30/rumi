import mongoose from 'mongoose';

/**
 * Lifestyle preferences sub-schema for compatibility matching.
 */
const lifestylePreferencesSchema = new mongoose.Schema(
  {
    foodPreference: { type: String, enum: ['veg', 'non-veg', 'egg', ''], default: '' },
    sleepSchedule: { type: String, enum: ['early_sleeper', 'night_owl', ''], default: '' },
    cleanlinessLevel: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
    smoking: { type: String, enum: ['yes', 'no', ''], default: '' },
    drinking: { type: String, enum: ['yes', 'no', ''], default: '' },
    pets: { type: String, enum: ['yes', 'no', ''], default: '' },
    guestPolicy: { type: String, enum: ['allowed', 'limited', 'not_allowed', ''], default: '' },
  },
  { _id: false }
);

/**
 * Verification status for phone and ID.
 */
const verificationStatusSchema = new mongoose.Schema(
  {
    phoneVerified: { type: Boolean, default: false },
    idVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Auth
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    passwordResetOtp: { type: String },
    passwordResetOtpExpiresAt: { type: Date },

    // Profile (lifestyle-based)
    name: { type: String, trim: true, default: '' },
    age: { type: Number, min: 18, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'non_binary', 'other', ''], default: '' },
    city: { type: String, trim: true, default: '' },
    profession: { type: String, enum: ['student', 'working', 'WFH', 'hybrid', ''], default: '' },
    intent: { type: String, enum: ['find', 'offer', 'explore', ''], default: '' },
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    bio: { type: String, default: '', maxlength: 500 },
    photo: { type: String, default: null },

    lifestylePreferences: { type: lifestylePreferencesSchema, default: () => ({}) },
    verificationStatus: { type: verificationStatusSchema, default: () => ({}) },

    // Legacy / extended fields
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    profilePicture: { type: String, default: null },
    verificationDocuments: [
      {
        type: { type: String, enum: ['aadhar', 'college_id'] },
        url: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ city: 1 });
userSchema.index({ 'lifestylePreferences.foodPreference': 1 });
userSchema.index({ trustScore: -1 });

export const User = mongoose.model('User', userSchema);
