import aiService from '../services/aiService.js';
import Message from '../models/message.model.js';

export const summarizeConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    console.log('Summarize request:', {
      userId,
      currentUser: req.user._id,
      limit
    });

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
        { senderId: req.user._id.toString(), receiverId: userId },
        { senderId: userId, receiverId: req.user._id.toString() }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
    
    console.log('Found messages:', messages.length);

    if (messages.length === 0) {
      console.log('No messages found for conversation');
      return res.status(400).json({ error: 'No messages found in this conversation' });
    }

    if (messages.length < 3) {
      console.log('Not enough messages for summary:', messages.length);
      return res.json({ 
        summary: `This conversation has ${messages.length} message${messages.length === 1 ? '' : 's'}. Too few messages to generate a meaningful summary.`,
        messageCount: messages.length,
        timeRange: messages.length > 0 ? {
          start: messages[0].createdAt,
          end: messages[messages.length - 1].createdAt
        } : null
      });
    }

    console.log('Calling AI service for summarization');
    
    try {
      const summary = await aiService.summarizeConversation(messages.reverse());
      
      res.json({ 
        summary,
        messageCount: messages.length,
        timeRange: {
          start: messages[0].createdAt,
          end: messages[messages.length - 1].createdAt
        }
      });
    } catch (aiError) {
      console.error('AI service failed:', aiError);
      console.error('AI error stack:', aiError.stack);
      res.status(500).json({ 
        error: 'AI service temporarily unavailable',
        details: aiError.message,
        stack: process.env.NODE_ENV === 'development' ? aiError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Summarization error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getSmartReplies = async (req, res) => {
  try {
    const { userId } = req.params;

    const recentMessages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
        { senderId: req.user._id.toString(), receiverId: userId },
        { senderId: userId, receiverId: req.user._id.toString() }
      ]
    })
    .populate('senderId', 'fullName')
    .sort({ createdAt: -1 })
    .limit(10);

    if (recentMessages.length === 0) {
      return res.json({ replies: ['Hello!', 'How are you?', 'Nice to meet you!'] });
    }

    const replies = await aiService.generateSmartReplies(
      recentMessages.reverse(), 
      req.user.fullName
    );
    
    res.json({ replies });
  } catch (error) {
    console.error('Smart replies error:', error);
    res.status(500).json({ error: 'Failed to generate replies' });
  }
};

export const moderateMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const moderation = await aiService.moderateContent(text);
    
    res.json(moderation);
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate content' });
  }
};

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage = 'en' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const translation = await aiService.translateMessage(text, targetLanguage);
    
    res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate message' });
  }
};

export const detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const detection = await aiService.detectLanguage(text);
    
    res.json(detection);
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
};