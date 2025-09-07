import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { chatWithBot, getBotInfo } from '../controllers/bot.controller.js';

const router = express.Router();

router.post('/chat', protectRoute, chatWithBot);
router.get('/info', protectRoute, getBotInfo);

export default router;