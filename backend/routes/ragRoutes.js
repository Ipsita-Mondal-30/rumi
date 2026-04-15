import express from 'express';
import { handleChat } from '../controllers/ragController.js';

const router = express.Router();

/**
 * Route for RAG chatbot.
 * POST /api/rag/chat
 */
router.post('/chat', handleChat);

export default router;
