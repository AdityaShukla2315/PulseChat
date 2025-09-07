import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSocket } from "../contexts/SocketContext";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { toast } from "react-hot-toast";
import MessageTranslation from "./MessageTranslation";
import BotChat from "./BotChat";

const ChatContainer = () => {
  const {
    messages = [],
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
    typingUserId
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle initial message load and subscription
  useEffect(() => {
    if (!selectedUser?._id) {
      return;
    }
    
    console.log('ChatContainer: Selected user changed to:', selectedUser._id);
    
    // Always fetch fresh messages when user is selected
    const loadMessages = async () => {
      try {
        console.log('Fetching messages for user:', selectedUser._id);
        await getMessages(selectedUser._id);
        markMessagesAsRead(selectedUser._id);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    loadMessages();
    
    // Subscribe to real-time messages
    const cleanup = subscribeToMessages();
    
    return () => {
      console.log('Unsubscribing from messages');
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      } else {
        unsubscribeFromMessages();
      }
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);
  
  // Handle scroll events with debounce
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) > 200;
    setIsScrolled(isNearBottom);
  }, []);
  
  // Handle socket events for moderated messages
  const { socket } = useSocket() || {};
  
  useEffect(() => {
    if (!socket) return;

    const handleMessageModerated = (data) => {
      const { messageId, reasons, details } = data;
      
      // Show a toast notification
      toast.error('Your message was moderated: ' + reasons.join(', '), {
        duration: 5000,
        position: 'bottom-center',
      });
      
      // Update the message in the UI with moderation details
      useChatStore.getState().updateMessageModerationStatus(messageId, {
        isModerated: true,
        moderationDetails: { reasons, details }
      });
    };

    socket.on('messageModerated', handleMessageModerated);
    
    return () => {
      socket.off('messageModerated', handleMessageModerated);
    };
  }, [socket]);

  // Auto-scroll to bottom only for new messages when user is at bottom
  useEffect(() => {
    if (messageEndRef.current && !isScrolled) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedUser?._id) {
      markMessagesAsRead(selectedUser._id);
    }
  }, [selectedUser?._id, markMessagesAsRead]);

  // Get a stable unique key for each message
  const getMessageKey = useCallback((message, index) => {
    if (!message) return `empty_${index}`;
    if (message._id && message._id.startsWith('temp_')) {
      return `temp_${message.senderId}_${message.createdAt || Date.now()}_${index}`;
    }
    if (message._id) {
      return `msg_${message._id}_${index}`;
    }
    return `fallback_${message.senderId}_${Date.now()}_${index}`;
  }, []);

  // Sort and filter messages
  const sortedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    
    return [...messages]
      .filter(msg => msg && (msg.text || msg.image))
      .sort((a, b) => {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
  }, [messages]);
  
  // Render a single message with delete-on-click
  const { deleteMessage } = useChatStore();
  const renderMessage = (message, index) => {
    if (!message) return null;
    const messageKey = getMessageKey(message, index);
    const isSender = message.senderId === authUser?._id;
    const isRead = message.readBy?.includes(selectedUser?._id) || false;
    const isDelivered = !!message._id && !message._id.startsWith('temp_');

    // Only allow sender to delete their own messages
    const canDelete = isSender && isDelivered && !message.isDeleting;

    const handleDelete = async () => {
      if (!canDelete) return;
      if (window.confirm('Delete this message?')) {
        await deleteMessage(message._id);
      }
    };

    return (
      <div
        key={messageKey}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
        data-message-id={message._id}
        onClick={canDelete ? handleDelete : undefined}
        style={canDelete ? { cursor: 'pointer', opacity: message.isDeleting ? 0.5 : 1 } : {}}
        title={canDelete ? 'Click to delete this message' : ''}
      >
        <div 
          className={`flex flex-col max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-2xl rounded-lg px-4 py-2 ${
            message.isModerated 
              ? 'border-2 border-warning/50 bg-warning/10' 
              : message.senderId === 'ai-assistant-bot'
                ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30'
                : isSender 
                  ? 'bg-primary text-primary-content' 
                  : 'bg-base-300 text-base-content'
          } ${
            message.isSending ? 'opacity-75' : ''
          } transition-all duration-200`}
        >
          {/* Moderation Warning */}
          {message.isModerated && (
            <div className="flex items-center text-warning text-xs mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>This message was moderated: {message.moderationDetails?.reasons?.join(', ') || 'Content not allowed'}</span>
            </div>
          )}
          {message.text && (
            <div className="break-words whitespace-pre-wrap relative group">
              {message.text}
              <MessageTranslation message={message} />
            </div>
          )}
          {message.image && (
            <div className="mt-2 rounded-lg overflow-hidden">
              <img 
                src={message.image} 
                alt="Shared content"
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/image-placeholder.png';
                }}
              />
            </div>
          )}
          <div className={`flex items-center justify-end mt-1 space-x-2 text-xs ${
            isSender ? 'text-primary-content/70' : 'text-base-content/70'
          }`}>
            <span>{formatMessageTime(message.createdAt)}</span>
            {isSender && (
              <span className="flex items-center">
                {message.isSending ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : isDelivered ? (
                  <span>✓{isRead ? '✓' : ''}</span>
                ) : null}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render empty state when no messages
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-base-200 rounded-full p-4 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-base-content/80 mb-2">No messages yet</h3>
      <p className="text-base-content/60 max-w-md">
        Start the conversation by sending a message to {selectedUser?.fullName || 'this user'}
      </p>
    </div>
  );

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader />
      </div>

      {/* Scrollable Message Area */}
      <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
        {sortedMessages.length > 0 ? (
          <div className="space-y-4 min-h-full flex flex-col justify-end">
            {/* Scroll to bottom button */}
            {isScrolled && (
              <button
                onClick={() => {
                  setIsScrolled(false);
                  messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="fixed bottom-24 right-6 bg-primary text-primary-content rounded-full p-3 shadow-lg hover:bg-primary-focus transition-all z-10"
                aria-label="Scroll to bottom"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {/* Messages */}
            <div className="space-y-4">
              {sortedMessages.map((message, idx) => (
                <div key={getMessageKey(message, idx)}>
                  {renderMessage(message, idx)}
                </div>
              ))}
              
              {/* Typing indicator */}
              {typingUserId === selectedUser?._id && (
                <div className="flex items-center space-x-2 py-2 px-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-base-content/60 ml-2">typing...</span>
                </div>
              )}
              <div ref={messageEndRef} className="h-4" />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            {renderEmptyState()}
          </div>
        )}
      </div>
      
      {/* Fixed Input */}
      <div className="flex-shrink-0">
        {selectedUser?._id === 'ai-assistant-bot' ? (
          <BotChat />
        ) : (
          <div className="border-t border-base-300 bg-base-100/80 backdrop-blur-sm p-4">
            <MessageInput />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
