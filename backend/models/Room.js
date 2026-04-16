import mongoose from 'mongoose';

/**
 * Room listing created by a user when they select "Offer a Room".
 * Used for recommendations in "Just Exploring" mode.
 */
const roomSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Room lifecycle / listing state.
    status: {
      type: String,
      enum: ['active', 'paused', 'rented'],
      default: 'paused',
    },
    /** Admin listing moderation (defaults to approved so legacy listings stay visible). */
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    // Total profile views for this listing.
    viewsCount: { type: Number, default: 0, min: 0 },

    // Property Details
    propertyType: {
      type: String,
      enum: ['apartment', 'pg', 'independent_house'],
      default: '',
    },
    roomType: { type: String, enum: ['private', 'shared', ''], default: '' },
    location: {
      city: { type: String, default: '' },
      area: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    monthlyRent: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    availableFrom: { type: Date, default: null },
    leaseDurationMonths: { type: Number, default: null, min: 0 },

    // Room & Amenities
    furnishingStatus: {
      type: String,
      enum: ['furnished', 'semi_furnished', 'unfurnished', ''],
      default: '',
    },
    attachedBathroom: { type: Boolean, default: false },
    amenities: {
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      washingMachine: { type: Boolean, default: false },
      kitchenAccess: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
    },
    bedAvailability: { type: Number, default: null, min: 0 },

    // Flatmate Preferences (for recommendation/matching later)
    flatmatePreferences: {
      preferredGender: { type: String, enum: ['male', 'female', 'non_binary', 'other', ''], default: '' },
      ageMin: { type: Number, default: null, min: 0 },
      ageMax: { type: Number, default: null, min: 0 },
      occupation: { type: String, enum: ['student', 'working', 'any', ''], default: '' },
      smokingAllowed: { type: String, enum: ['allowed', 'not_allowed', ''], default: '' },
      drinkingAllowed: { type: String, enum: ['allowed', 'not_allowed', ''], default: '' },
      petsAllowed: { type: String, enum: ['allowed', 'not_allowed', ''], default: '' },
      foodPreference: { type: String, enum: ['veg', 'non-veg', 'any', ''], default: '' },
      sleepSchedule: { type: String, enum: ['early_sleeper', 'night_owl', ''], default: '' },
      cleanlinessLevel: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
      socialLevel: { type: String, default: '' },
    },

    // Photos & Media
    photoUrls: { type: [String], default: [] },
    videoUrl: { type: String, default: '' },

    // Description
    roomDescription: { type: String, default: '', maxlength: 2000 },

    // Contact Preferences
    contactPreferences: {
      phoneVisibility: { type: Boolean, default: false },
      chatOption: { type: Boolean, default: true },
      preferredContactTime: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

roomSchema.index({ 'location.city': 1 });
roomSchema.index({ monthlyRent: 1 });
roomSchema.index({ ownerUserId: 1, status: 1 });

export const Room = mongoose.model('Room', roomSchema);

