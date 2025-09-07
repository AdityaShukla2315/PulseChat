import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Code, Database, Cloud } from 'lucide-react';
import { axiosInstance } from '../lib/axios';

const DevBotWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQueries = [
    { icon: Code, text: 'How does machine learning work?', category: 'Tech' },
    { icon: Database, text: 'Explain climate change', category: 'Science' },
    { icon: Cloud, text: 'Tips for healthy living', category: 'Health' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuery = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMessage = { text: queryText, isBot: false, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/widget/chat', { text: queryText.trim() });
      const botMessage = { 
        text: response.data.botResponse, 
        isBot: true, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Bot query failed:', error);
      const errorMessage = { 
        text: '🤖 DevBot is temporarily unavailable. Please try again.', 
        isBot: true, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleQuery(query);
  };

  return (
    <div className="relative">
      {/* Bot Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`btn btn-ghost btn-sm rounded-full transition-all duration-300 ${
          isExpanded ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'
        }`}
        title="PulseBot - AI Assistant"
      >
        <Bot className="w-5 h-5" />
        <Sparkles className="w-3 h-3 -ml-1" />
      </button>

      {/* Expandable Chat Widget */}
      {isExpanded && (
        <div className="fixed top-16 right-4 w-72 h-80 bg-base-100 rounded-lg shadow-2xl border border-base-300 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">PulseBot</h3>
                <p className="text-xs text-base-content/70">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <Bot className="w-8 h-8 mx-auto text-primary/50 mb-2" />
                <p className="text-sm text-base-content/70 mb-3">
                  Hi! I'm PulseBot, your AI assistant. Ask me anything!
                </p>
                <div className="space-y-2">
                  {quickQueries.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuery(item.text)}
                      className="flex items-center gap-2 w-full p-2 text-xs bg-base-200/50 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <item.icon className="w-3 h-3 text-primary" />
                      <span className="flex-1 text-left">{item.text}</span>
                      <span className="text-xs text-base-content/50">{item.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.isBot
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20'
                      : 'bg-primary text-primary-content'
                  }`}
                >
                  {message.isBot && (
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3" />
                      <span className="text-xs font-medium">PulseBot</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3" />
                    <span className="text-xs">PulseBot is thinking...</span>
                    <span className="loading loading-dots loading-xs"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-base-300">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 input input-sm input-bordered"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="btn btn-primary btn-sm btn-circle"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevBotWidget;