/**
 * Gemini API integration for compatibility explanation.
 * Set env: GEMINI_API_KEY
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (err) {
      console.warn('Gemini init error:', err.message);
      return null;
    }
  }
  return genAI;
}

/**
 * Generate a short compatibility explanation for two users.
 * @param {Object} userA - User profile (name, bio, lifestylePreferences, etc.)
 * @param {Object} userB - User profile
 * @param {{ matchScore: number, reasons: string[] }} matchResult - From matchingService
 * @returns {Promise<string|null>} compatibilityExplanation or null if API fails
 */
export async function getCompatibilityExplanation(userA, userB, matchResult) {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are a flatmate compatibility expert. Explain in 2-3 short sentences why these two people could be good flatmates based on their lifestyle preferences. Be friendly and specific. Do not make up details not given.

User A: ${userA.name || 'Unknown'}, ${userA.bio || 'No bio'}. Preferences: ${JSON.stringify(userA.lifestylePreferences || {})}. Budget: ₹${userA.budgetRange?.min ?? 0}-${userA.budgetRange?.max ?? 0}k.

User B: ${userB.name || 'Unknown'}, ${userB.bio || 'No bio'}. Preferences: ${JSON.stringify(userB.lifestylePreferences || {})}. Budget: ₹${userB.budgetRange?.min ?? 0}-${userB.budgetRange?.max ?? 0}k.

Match score: ${matchResult.matchScore}%. Matching reasons: ${(matchResult.reasons || []).join(', ') || 'None'}.

Return only the explanation text, no labels or quotes.`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response?.text?.()?.trim();
    return text || null;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

/**
 * Gemini-powered assistant chat.
 * @param {{ messages?: Array<{role: 'user'|'assistant', text: string}>, message?: string }} payload
 * @returns {Promise<string>}
 */
export async function getAssistantReply(payload) {
  const client = getClient();
  if (!client) {
    return 'AI is not available right now. Please try again later.';
  }

  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const fallbackMessage = payload?.message ? String(payload.message) : '';

  const safeMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({
      role: m.role,
      text: String(m.text || ''),
    }))
    .filter((m) => m.text.trim().length > 0);

  const lastUser =
    fallbackMessage ||
    [...safeMessages].reverse().find((m) => m.role === 'user')?.text ||
    '';

  const history = safeMessages
    .slice(-10) // keep prompt short
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const prompt = `You are Rumi's friendly assistant for flatmate matching.\n\n` +
    `Your goals:\n` +
    `1) Help users find compatible flatmates (based on their preferences and matching).\n` +
    `2) Explain how the matching works in simple terms.\n` +
    `3) Answer safety questions and suggest safe communication practices.\n\n` +
    `Rules:\n` +
    `- Be concise and helpful.\n` +
    `- Do not invent personal details about specific users.\n` +
    `- If the user asks for harmful or unsafe instructions, refuse and suggest safer alternatives.\n\n` +
    `Conversation so far:\n${history || '(no prior messages)'}\n\n` +
    `Now respond to the user:\nUser: ${lastUser}\nAssistant:`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response?.text?.()?.trim();
    return text || 'Okay — tell me a bit more.';
  } catch (err) {
    console.error('Gemini assistant API error:', err.message);
    return 'Sorry — I could not generate a response. Please try again.';
  }
}
