import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { widgetChat } from '../controllers/widget.controller.js';

const router = express.Router();

router.post('/chat', protectRoute, widgetChat);

export default router;