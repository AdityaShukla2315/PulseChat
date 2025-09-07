import { useState } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useChatStore } from '../store/useChatStore';

const BotChat = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedUser, messages, setSelectedUser } = useChatStore();

  const isBot = selectedUser?._id === 'ai-assistant-bot';

  const handleBotQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      await axiosInstance.post('/bot/chat', { text: query.trim() });
      setQuery('');
    } catch (error) {
      console.error('Bot query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    'How to optimize React performance?',
    'Best practices for Node.js APIs?',
    'Explain microservices architecture',
    'Database indexing strategies',
    'CI/CD pipeline setup guide',
    'TypeScript vs JavaScript pros/cons',
    'How to handle async operations?',
    'REST vs GraphQL comparison'
  ];

  if (!isBot) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Bot Header */}
      <div className="p-4 border-b border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              DevBot - Expert Developer
              <Sparkles className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-sm text-base-content/70">Your coding mentor & problem solver</p>
          </div>
        </div>
      </div>

      {/* Quick Query Suggestions */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-base-300">
          <p className="text-sm text-base-content/70 mb-3">Popular dev questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQueries.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bot Input */}
      <div className="p-4 border-t border-base-300 bg-base-100">
        <form onSubmit={handleBotQuery} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about coding, architecture, best practices..."
            className="flex-1 input input-bordered input-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="btn btn-primary btn-sm btn-circle"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BotChat;