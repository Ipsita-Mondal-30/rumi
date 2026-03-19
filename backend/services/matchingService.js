/**
 * Rumi compatibility scoring (0–100).
 * Factor points: same city +25, budget overlap +20, cleanliness ≤1 +15,
 * sleep match +10, food +10, smoking +10, working status +10. Max = 100.
 */

const POINTS = {
  sameCity: 25,
  budgetOverlap: 20,
  cleanlinessSimilar: 15,
  sleepSchedule: 10,
  foodPreference: 10,
  smoking: 10,
  workingStatus: 10,
};
const MAX_SCORE = 100;

/** Cleanliness order for "difference ≤ 1" (low=0, medium=1, high=2). */
const CLEAN_ORDER = { low: 0, medium: 1, high: 2, '': -1 };

function budgetOverlap(a, b) {
  const aMin = a?.min ?? 0;
  const aMax = a?.max ?? 0;
  const bMin = b?.min ?? 0;
  const bMax = b?.max ?? 0;
  if (aMax < bMin || bMax < aMin) return false;
  return true;
}

function cleanlinessDifference(levelA, levelB) {
  const va = CLEAN_ORDER[levelA] ?? -1;
  const vb = CLEAN_ORDER[levelB] ?? -1;
  if (va < 0 || vb < 0) return 999;
  return Math.abs(va - vb);
}

/**
 * Calculate compatibility score (0–100) and reasons.
 * @param {Object} userA - User document (city, budgetRange, lifestylePreferences, profession)
 * @param {Object} userB - User document
 * @returns {{ matchScore: number, reasons: string[] }}
 */
export function calculateMatch(userA, userB) {
  let score = 0;
  const reasons = [];

  const cityA = (userA.city || userA.location?.city || '').toString().trim().toLowerCase();
  const cityB = (userB.city || userB.location?.city || '').toString().trim().toLowerCase();
  if (cityA && cityB && cityA === cityB) {
    score += POINTS.sameCity;
    reasons.push('Same city');
  }

  if (budgetOverlap(userA.budgetRange, userB.budgetRange)) {
    score += POINTS.budgetOverlap;
    reasons.push('Budget overlap');
  }

  const prefsA = userA.lifestylePreferences || {};
  const prefsB = userB.lifestylePreferences || {};
  const cleanDiff = cleanlinessDifference(prefsA.cleanlinessLevel, prefsB.cleanlinessLevel);
  if (cleanDiff <= 1 && cleanDiff < 999) {
    score += POINTS.cleanlinessSimilar;
    reasons.push('Similar cleanliness');
  }

  const sleepA = (prefsA.sleepSchedule || '').toString().toLowerCase();
  const sleepB = (prefsB.sleepSchedule || '').toString().toLowerCase();
  if (sleepA && sleepB && sleepA === sleepB) {
    score += POINTS.sleepSchedule;
    reasons.push('Similar sleep schedule');
  }

  const foodA = (prefsA.foodPreference || '').toString().toLowerCase();
  const foodB = (prefsB.foodPreference || '').toString().toLowerCase();
  if (foodA && foodB && foodA === foodB) {
    score += POINTS.foodPreference;
    reasons.push('Same food preference');
  }

  const smokeA = (prefsA.smoking || '').toString().toLowerCase();
  const smokeB = (prefsB.smoking || '').toString().toLowerCase();
  if (smokeA && smokeB && smokeA === smokeB) {
    score += POINTS.smoking;
    reasons.push('Smoking preference match');
  }

  const workA = (userA.profession || '').toString().toLowerCase();
  const workB = (userB.profession || '').toString().toLowerCase();
  if (workA && workB && workA === workB) {
    score += POINTS.workingStatus;
    reasons.push('Similar working status');
  }

  const compatibility = Math.min(MAX_SCORE, score);
  return {
    matchScore: compatibility,
    reasons,
  };
}
