import aiService from '../services/aiService.js';
import Message from '../models/message.model.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

const BOT_USER = {
  _id: 'ai-assistant-bot',
  fullName: 'DevBot - Expert Developer',
  username: 'devbot_expert',
  profilePic: '/bot-avatar.svg',
  isBot: true
};

export const chatWithBot = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Save user message
    const userMessage = new Message({
      senderId: userId.toString(),
      receiverId: BOT_USER._id,
      text: text.trim()
    });
    await userMessage.save();

    // Get recent conversation for context
    const recentMessages = await Message.find({
      $or: [
        { senderId: userId.toString(), receiverId: BOT_USER._id },
        { senderId: BOT_USER._id, receiverId: userId.toString() }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Generate bot response with context
    const botResponse = await aiService.generateBotResponse(text.trim(), recentMessages.reverse());

    // Save bot response
    const botMessage = new Message({
      senderId: BOT_USER._id,
      receiverId: userId.toString(),
      text: botResponse
    });
    await botMessage.save();

    // Emit messages via socket
    const userSocketId = getReceiverSocketId(userId.toString());
    if (userSocketId) {
      io.to(userSocketId).emit('newMessage', {
        ...botMessage.toObject(),
        sender: BOT_USER
      });
    }

    res.json({
      userMessage: userMessage.toObject(),
      botMessage: { ...botMessage.toObject(), sender: BOT_USER }
    });

  } catch (error) {
    console.error('Bot chat error:', error);
    res.status(500).json({ error: 'Failed to process bot message' });
  }
};

export const getBotInfo = (req, res) => {
  res.json(BOT_USER);
};