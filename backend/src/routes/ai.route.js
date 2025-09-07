import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import {
  summarizeConversation,
  getSmartReplies,
  moderateMessage,
  translateMessage,
  detectLanguage
} from '../controllers/ai.controller.js';

const router = express.Router();

router.get('/summarize/:userId', protectRoute, summarizeConversation);
router.get('/smart-replies/:userId', protectRoute, cacheMiddleware(req => `replies_${req.user._id}_${req.params.userId}`), getSmartReplies);
router.post('/moderate', protectRoute, moderateMessage);
router.post('/translate', protectRoute, translateMessage);
router.post('/detect-language', protectRoute, detectLanguage);

export default router;