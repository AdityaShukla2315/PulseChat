import aiService from '../services/aiService.js';

export const widgetChat = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Generate general AI response
    const botResponse = await aiService.generateGeneralResponse(text.trim());

    res.json({
      userMessage: text.trim(),
      botResponse
    });

  } catch (error) {
    console.error('Widget chat error:', error);
    res.status(500).json({ error: 'Failed to process widget message' });
  }
};