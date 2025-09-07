import { useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useChatStore } from '../store/useChatStore';

const ConversationSummary = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { selectedUser } = useChatStore();

  const generateSummary = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/ai/summarize/${selectedUser._id}?limit=50`);
      setSummary(response.data.summary);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      const errorMsg = error.response?.data?.error || 'Unable to generate summary. Please try again.';
      setSummary(errorMsg);
      setShowSummary(true);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) return null;

  return (
    <>
      <button
        onClick={generateSummary}
        disabled={loading}
        className="btn btn-ghost btn-sm gap-2"
        title="Generate conversation summary"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Summary
      </button>

      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Conversation Summary
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-base-content/80 leading-relaxed">
                {summary}
              </p>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSummary(false)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationSummary;