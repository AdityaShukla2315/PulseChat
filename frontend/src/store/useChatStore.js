import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create(
  persist(
    (set, get) => ({
  messages: [],
  messagesByUser: {}, // Store messages per user
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUserId: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      // Add lastMessage, lastMessageTime, and unread to each user
      const usersWithPreview = await Promise.all(res.data.map(async (user) => {
        try {
          const msgRes = await axiosInstance.get(`/messages/${user._id}`);
          const messages = msgRes.data;
          if (messages && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            // Unread if last message is to me and not read
            const authUser = useAuthStore.getState().authUser;
            const isUnread = lastMsg.receiverId === authUser?._id && (!lastMsg.readBy || !lastMsg.readBy.includes(authUser._id));
            return {
              ...user,
              lastMessage: lastMsg.text || (lastMsg.image ? '📷 Image' : ''),
              lastMessageTime: lastMsg.createdAt,
              unread: isUnread,
            };
          }
        } catch (e) {}
        return { ...user, lastMessage: '', lastMessageTime: null, unread: false };
      }));
      set({ users: usersWithPreview });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      console.log('Fetching messages for user:', userId);
      const res = await axiosInstance.get(`/messages/${userId}`);
      console.log('Fetched messages:', res.data);
      set((state) => ({
        messages: res.data,
        messagesByUser: {
          ...state.messagesByUser,
          [userId]: res.data
        }
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;

    // Robust frontend validation
    if (!selectedUser || !authUser) {
      toast.error("No user selected or not authenticated");
      return;
    }
    const hasText = messageData.text && messageData.text.trim().length > 0;
    const hasImage = !!messageData.image;
    if (!hasText && !hasImage) {
      toast.error("Cannot send an empty message. Please enter text or attach an image.");
      return;
    }

    console.log('Sending message with data:', messageData);

    // Generate a temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the message object with all required fields
    const tempMessage = {
      _id: tempId,
      text: messageData.text || '',
      image: messageData.image || null,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSending: true,
      // Ensure we have all required fields for the message
      sender: {
        _id: authUser._id,
        fullName: authUser.fullName || 'You',
        profilePic: authUser.profilePic || '/avatar.png'
      },
      receiver: {
        _id: selectedUser._id,
        fullName: selectedUser.fullName || 'User',
        profilePic: selectedUser.profilePic || '/avatar.png'
      }
    };

    console.log('Adding temporary message:', tempMessage);

    // Add temporary message to state immediately
    set((state) => {
      const newMessages = [...state.messages, tempMessage];
      return {
        messages: newMessages,
        messagesByUser: {
          ...state.messagesByUser,
          [selectedUser._id]: newMessages
        }
      };
    });


    try {
      // Always send as JSON, even for images (image must be base64 string)
      const payload = {
        text: messageData.text || '',
        image: messageData.image || null
      };
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Message sent successfully:', res.data);

      // Update the temporary message with the server response
      set((state) => {
        const updatedMessages = state.messages.map(msg => 
          msg._id === tempId ? { ...res.data, isSending: false } : msg
        );
        return { 
          messages: updatedMessages,
          messagesByUser: {
            ...state.messagesByUser,
            [selectedUser._id]: updatedMessages
          }
        };
      });

      return res.data;
    } catch (error) {
      console.error("Error sending message:", error);

      // Update the message to show error state
      set((state) => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? { ...msg, error: true, isSending: false } : msg
        ),
        messagesByUser: {
          ...state.messagesByUser,
          [selectedUser._id]: (state.messagesByUser[selectedUser._id] || []).map(msg => 
            msg._id === tempId ? { ...msg, error: true, isSending: false } : msg
          )
        }
      }));

      const errorMessage = error.response?.data?.message || "Failed to send message";
      toast.error(errorMessage);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    
    if (!selectedUser || !authUser) {
      console.error("No selected user or auth user for message subscription");
      return;
    }

    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.error("Socket not available for subscription");
      return;
    }
    
    console.log('Setting up message subscription for user:', authUser._id, 'with selected user:', selectedUser._id);

    // Handle message deleted event
    const handleMessageDeleted = ({ messageId }) => {
      console.log('Message deleted event received:', messageId);
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== messageId)
      }));
    };
    
    // Set up event listeners
    socket.on("messageDeleted", handleMessageDeleted);
    
    // Log socket connection status
    console.log('Socket connected:', socket.connected);
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    const handleNewMessage = (newMessage) => {
      console.log("\n=== New Message Event ===");
      console.log("Message received:", JSON.stringify(newMessage, null, 2));
      console.log("Current selected user ID:", selectedUser?._id);
      console.log("Auth user ID:", authUser?._id);
      console.log("Message sender ID:", newMessage?.senderId);
      console.log("Message receiver ID:", newMessage?.receiverId);
      console.log("Socket connected:", socket?.connected);
      console.log("Socket ID:", socket?.id);
      
      // Ensure the message has all required fields
      if (!newMessage) {
        console.error('Received null or undefined message');
        return;
      }
      
      // If message is missing both text and image, log it but don't filter it out
      // as it might be a system message or have other important data
      if (!newMessage.text && !newMessage.image) {
        console.warn('Message has no text or image content:', newMessage);
      }
      
      // Convert IDs to strings for consistent comparison
      const currentUserId = authUser._id?.toString();
      const selectedUserId = selectedUser._id?.toString();
      const messageSenderId = newMessage.senderId?.toString();
      const messageReceiverId = newMessage.receiverId?.toString();
      
      // Log ID comparison for debugging
      console.log('ID Comparison:', {
        currentUserId,
        selectedUserId,
        messageSenderId,
        messageReceiverId
      });
      
      // Always process the message if it's from or to the current user
      const isRelevantMessage = 
        messageSenderId === currentUserId || 
        messageReceiverId === currentUserId ||
        messageSenderId === selectedUserId ||
        messageReceiverId === selectedUserId;
      
      console.log('Message relevance check:', {
        isRelevantMessage,
        isFromMe: messageSenderId === currentUserId,
        isToMe: messageReceiverId === currentUserId,
        isFromSelected: messageSenderId === selectedUserId,
        isToSelected: messageReceiverId === selectedUserId
      });
      
      if (!isRelevantMessage) {
        console.log('Message not relevant to current chat, but will process it anyway');
        // Don't return here, process all messages for now
      }

      // Notification logic: show toast and browser notification if message is for current user and chat is not open
      if (
        newMessage.receiverId === authUser._id &&
        (!selectedUser || selectedUser._id !== newMessage.senderId)
      ) {
        const senderName = newMessage.sender?.fullName || 'New Message';
        const messagePreview = newMessage.text ? newMessage.text.slice(0, 60) : (newMessage.image ? '📷 Image' : '');
        toast(`${senderName}: ${messagePreview}`, { icon: '💬', duration: 4000 });
        // Browser notification
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(senderName, {
            body: messagePreview,
            icon: newMessage.sender?.profilePic || '/avatar.png',
          });
        } else if (window.Notification && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
      set((state) => {
        // Prevent duplicate messages by _id
        if (state.messages.some(msg => msg._id === newMessage._id)) {
          return state;
        }
        
        // Determine which user this message belongs to
        const currentUserId = authUser._id?.toString();
        const messageSenderId = newMessage.senderId?.toString();
        const messageReceiverId = newMessage.receiverId?.toString();
        
        let targetUserId;
        if (messageSenderId === currentUserId) {
          targetUserId = messageReceiverId; // Message sent by me to someone
        } else {
          targetUserId = messageSenderId; // Message received from someone
        }
        
        // Check if this replaces a temp message
        const existingMessages = state.messagesByUser[targetUserId] || [];
        const tempIndex = existingMessages.findIndex(msg =>
          msg._id && typeof msg._id === 'string' && msg._id.startsWith('temp_') &&
          msg.senderId === messageSenderId &&
          Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 10000
        );
        
        let updatedUserMessages;
        if (tempIndex !== -1) {
          // Replace temp message
          updatedUserMessages = [...existingMessages];
          updatedUserMessages[tempIndex] = { ...newMessage, isSending: false, error: false };
        } else {
          // Add new message
          updatedUserMessages = [...existingMessages, { ...newMessage, isSending: false, error: false }];
        }
        
        const updatedMessages = targetUserId === selectedUser?._id ? updatedUserMessages : state.messages;
        
        return {
          messages: updatedMessages,
          messagesByUser: {
            ...state.messagesByUser,
            [targetUserId]: updatedUserMessages
          }
        };
      });
    };

    // Listen for new messages
    socket.on("newMessage", handleNewMessage);

    // Typing indicator events
    const handleTyping = ({ senderId }) => {
      console.log("User typing:", senderId);
      set({ typingUserId: senderId });
    };

    const handleStopTyping = ({ senderId }) => {
      console.log("User stopped typing:", senderId);
      set({ typingUserId: null });
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    // Cleanup function
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      // Clean up all event listeners
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageDeleted");
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();
    
    try {
      // Optimistic update
      set({
        messages: messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleting: true } 
            : msg
        )
      });
      
      // API call to delete message
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Remove the message from the store
      set({
        messages: messages.filter(msg => msg._id !== messageId)
      });
      
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
      
      // Revert optimistic update on error
      set({
        messages: messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleting: false } 
            : msg
        )
      });
    }
  },
  
  setSelectedUser: (selectedUser) => {
    set((state) => {
      // Get existing messages for this user
      const userMessages = state.messagesByUser[selectedUser._id] || [];
      
      return {
        selectedUser,
        messages: userMessages,
        users: state.users.map(u =>
          u._id === selectedUser._id
            ? { ...u, unread: false }
            : u
        )
      };
    });
    
    // Always fetch fresh messages to ensure they're up to date
    get().getMessages(selectedUser._id);
  },

  /**
   * Mark all messages from the selected user as read
   * @param {string} userId - The userId whose messages should be marked as read
   */
  markMessagesAsRead: (userId) => {
    set((state) => {
      const updatedMessages = state.messages.map((msg) => {
        if (msg.senderId === userId && (!msg.readBy || !msg.readBy.includes(userId))) {
          return {
            ...msg,
            readBy: [...(msg.readBy || []), userId],
          };
        }
        return msg;
      });
      return { messages: updatedMessages };
    });
  },
}),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        messagesByUser: state.messagesByUser,
        selectedUser: state.selectedUser 
      }),
      version: 2,
    }
  )
);
