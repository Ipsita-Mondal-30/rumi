import express from 'express';
import { getAssistantReply } from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /assistant/chat
 * Body: { messages?: Array<{ role: 'user'|'assistant', text: string }>, message?: string }
 * Returns: { success: true, reply: string }
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, message } = req.body || {};
    const reply = await getAssistantReply({ messages, message });
    return res.json({ success: true, reply: reply || '' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('assistant chat error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error.' });
  }
});

export default router;

