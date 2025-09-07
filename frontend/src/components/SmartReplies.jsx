import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useChatStore } from '../store/useChatStore';

const SmartReplies = ({ onReplySelect }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedUser } = useChatStore();

  const fetchSmartReplies = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/ai/smart-replies/${selectedUser._id}`);
      setReplies(response.data.replies || []);
    } catch (error) {
      console.error('Failed to fetch smart replies:', error);
      setReplies(['Thanks!', 'Got it', 'Sounds good']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartReplies();
  }, [selectedUser]);

  if (!selectedUser || replies.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-base-200/50 rounded-lg mb-2">
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-xs text-base-content/70">Quick replies:</span>
      
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      ) : (
        <div className="flex gap-1 flex-wrap">
          {replies.slice(0, 3).map((reply, index) => (
            <button
              key={index}
              onClick={() => onReplySelect(reply)}
              className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={fetchSmartReplies}
        className="ml-auto text-xs text-base-content/50 hover:text-base-content/70"
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  );
};

export default SmartReplies;