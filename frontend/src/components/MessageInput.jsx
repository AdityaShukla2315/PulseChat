import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";
import SmartReplies from "./SmartReplies";
const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();
  const { selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  // Expert handleTyping function: emits 'typing' event with debounce
  const handleTyping = () => {
    if (!socket || !selectedUser) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: selectedUser._id });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }, 1500); // 1.5s debounce
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text || !text.trim()) && !imagePreview) return;
    
    const messageText = text?.trim() || '';
    console.log('Sending message:', { text: messageText, hasImage: !!imagePreview });

    try {
      // Create message data with proper structure
      const messageData = {
        text: messageText,
        image: imagePreview,
      };
      
      console.log('Sending message data:', messageData);
      
      // Clear input immediately for better UX
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Send the message using the store's sendMessage function
      // This will handle optimistic updates automatically
      await sendMessage(messageData);
      console.log('Message sent successfully');
      
      // Stop typing event
      if (socket && selectedUser) {
        setIsTyping(false);
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
      
      // Re-enable the send button if there was an error
      setText(messageText);
      if (imagePreview) {
        setImagePreview(imagePreview);
      }
    }
  };

  const handleSmartReplySelect = (reply) => {
    setText(reply);
  };

  return (
    <div className="p-4 w-full bg-base-100 border-t border-base-300">
      <SmartReplies onReplySelect={handleSmartReplySelect} />
      {/* Emoji picker placeholder */}
      <div className="mb-2 flex items-center gap-2">
        {/* TODO: Integrate emoji-mart for emoji picker */}
        <button
          type="button"
          className="btn btn-sm btn-ghost rounded-full"
          title="Add emoji (coming soon)"
          tabIndex={-1}
        >
          <span role="img" aria-label="emoji">😊</span>
        </button>
        <span className="text-xs text-zinc-400">Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for newline</span>
      </div>

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700 shadow-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center shadow"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-xl input-sm sm:input-md focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!socket || !selectedUser) return;
              handleTyping();
            }}
            autoFocus
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle btn-ghost border border-base-300 hover:border-primary/60
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-circle"
          disabled={(!text?.trim() && !imagePreview) || useChatStore.getState().isMessagesLoading}
          title="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
