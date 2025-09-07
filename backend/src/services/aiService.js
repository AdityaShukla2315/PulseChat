import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 150,
      },
    });
  }

  // Message Summarization
  async summarizeConversation(messages) {
    try {
      console.log('AI Service: Starting summarization for', messages.length, 'messages');
      
      const conversation = messages
        .filter(msg => msg.text && msg.text.trim())
        .map(msg => {
          const senderName = msg.senderId?.fullName || msg.sender?.fullName || 'User';
          return `${senderName}: ${msg.text}`;
        })
        .join('\n');

      console.log('AI Service: Filtered conversation length:', conversation.length);

      if (!conversation.trim()) {
        console.log('AI Service: No text messages found');
        return 'No text messages found to summarize.';
      }

      const prompt = `Summarize in 2 sentences:\n${conversation}`;
      console.log('AI Service: Sending prompt to Gemini');
      
      const result = await this.model.generateContent(prompt);
      const summary = result.response.text();
      console.log('AI Service: Generated summary:', summary.substring(0, 100) + '...');
      return summary;
    } catch (error) {
      console.error('AI Service: Summarization error:', error.message);
      if (error.message.includes('429') || error.message.includes('quota')) {
        return 'Summary unavailable: Daily API quota exceeded. Please try again tomorrow or upgrade your Gemini API plan.';
      }
      throw error;
    }
  }

  // Smart Reply Suggestions
  async generateSmartReplies(recentMessages, currentUser) {
    try {
      const context = recentMessages
        .slice(-5)
        .filter(msg => msg.text && msg.text.trim())
        .map(msg => {
          const senderName = msg.senderId?.fullName || msg.sender?.fullName || 'User';
          return `${senderName}: ${msg.text}`;
        })
        .join('\n');

      if (!context.trim()) {
        return ['Hello!', 'How are you?', 'Nice to meet you!'];
      }

      const prompt = `Reply options for ${currentUser}:\n${context}\n\nJSON array of 3 brief replies:`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        return JSON.parse(response);
      } catch {
        return response.split('\n').filter(line => line.trim()).slice(0, 3);
      }
    } catch (error) {
      console.error('Smart replies error:', error);
      return ['Thanks!', 'Got it', 'Sounds good'];
    }
  }

  // Content Moderation
  async moderateContent(text) {
    try {
      const prompt = `Is this toxic? JSON: {"isToxic": bool, "confidence": 0-1, "reason": "text"}\n"${text}"`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        return JSON.parse(response);
      } catch {
        return { isToxic: false, confidence: 0, reason: 'Unable to analyze' };
      }
    } catch (error) {
      console.error('Content moderation error:', error);
      return { isToxic: false, confidence: 0, reason: 'Moderation unavailable' };
    }
  }

  // Language Translation using Gemini
  async translateMessage(text, targetLanguage = 'en') {
    try {
      const languageNames = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi'
      };
      
      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      
      const prompt = `Translate the following text to ${targetLangName}. Also detect the source language. Respond in JSON format: {"translatedText": "translation", "sourceLanguage": "detected_language_code", "confidence": 0.95}\n\nText: "${text}"`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const parsed = JSON.parse(response);
        return {
          originalText: text,
          translatedText: parsed.translatedText || text,
          sourceLanguage: parsed.sourceLanguage || 'unknown',
          targetLanguage,
          confidence: parsed.confidence || 0.9
        };
      } catch {
        return {
          originalText: text,
          translatedText: response,
          sourceLanguage: 'unknown',
          targetLanguage,
          confidence: 0.8
        };
      }
    } catch (error) {
      console.error('Translation error:', error);
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: 'unknown',
        targetLanguage,
        confidence: 0
      };
    }
  }

  // Detect language using Gemini
  async detectLanguage(text) {
    try {
      const prompt = `Detect the language of this text and respond with JSON format: {"language": "language_code", "confidence": 0.95}\n\nText: "${text}"`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const parsed = JSON.parse(response);
        return {
          language: parsed.language || 'en',
          confidence: parsed.confidence || 0.9
        };
      } catch {
        return { language: 'en', confidence: 0.5 };
      }
    } catch (error) {
      console.error('Language detection error:', error);
      return { language: 'en', confidence: 0 };
    }
  }

  // AI Assistant Bot Response - Expert Developer
  async generateBotResponse(userQuery) {
    try {
      const prompt = `You are DevBot, a world-class senior full-stack developer and technical architect with 15+ years of experience. You're known for:

🎯 **EXPERTISE AREAS:**
• Frontend: React, Vue, Angular, Next.js, TypeScript, Tailwind CSS
• Backend: Node.js, Python, Java, Go, .NET, PHP
• Databases: PostgreSQL, MongoDB, Redis, MySQL, Elasticsearch
• Cloud & DevOps: AWS, Azure, GCP, Docker, Kubernetes, CI/CD
• Architecture: Microservices, Event-driven, Serverless, DDD
• Mobile: React Native, Flutter, iOS, Android

🧠 **RESPONSE STYLE:**
• Provide expert-level, actionable advice
• Include practical code examples when relevant
• Explain the "why" behind recommendations
• Suggest best practices and potential pitfalls
• Be concise but comprehensive
• Use emojis sparingly for clarity

**Question:** "${userQuery}"

**Expert Response:**`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Bot response error:', error);
      if (error.message.includes('429') || error.message.includes('quota')) {
        return '🤖 I\'ve reached my daily quota limit. Please try again tomorrow or the admin can upgrade the API plan.';
      }
      return '🤖 DevBot is temporarily offline. As a developer, I understand how frustrating downtime can be! Please try again in a moment.';
    }
  }

  // General AI Assistant Response - Context-aware
  async generateGeneralResponse(userQuery) {
    try {
      const prompt = `You are PulseBot, an intelligent and helpful AI assistant. Provide accurate, contextual, and concise responses to any question or topic.

**Guidelines:**
• Answer strictly according to the context and topic of the question
• Be informative, helpful, and friendly
• Provide practical and actionable information when possible
• Keep responses concise but comprehensive
• Adapt your expertise level to match the question's complexity
• If you're unsure about something, say so honestly

**Question:** "${userQuery}"

**Response:**`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('General AI response error:', error);
      if (error.message.includes('429') || error.message.includes('quota')) {
        return '🤖 I\'ve reached my daily quota limit. Please try again tomorrow or the admin can upgrade the API plan.';
      }
      return '🤖 I\'m having trouble processing your request right now. Please try again in a moment.';
    }
  }
}

export default new AIService();