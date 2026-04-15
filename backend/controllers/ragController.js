import { getRAGReply } from '../services/ragService.js';

/**
 * Controller for RAG-based chat operations.
 */
export async function handleChat(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string.' });
    }

    const reply = await getRAGReply(message);

    return res.json({ reply });
  } catch (error) {
    console.error('ragController error:', error?.message || error);
    return res.status(500).json({
      reply: 'I encountered a technical issue. Please try again later.',
      error: error?.message || String(error),
    });
  }
}

export default { handleChat };
