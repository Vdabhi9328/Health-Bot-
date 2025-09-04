import express from 'express';
import { processChatMessage, getChatHistory } from '../controllers/Chat.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Process chat message (voice or text)
router.post('/chat', authenticate, processChatMessage);

// Get chat history for a user
router.get('/chat/history/:userId', authenticate, getChatHistory);

export default router;
