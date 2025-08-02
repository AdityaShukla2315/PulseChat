import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  const startTime = Date.now();
  const requestId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  console.log(`\n=== Send Message Request [${requestId}] ===`);
  console.log('Params:', req.params);
  console.log('Body:', { ...req.body, image: req.body.image ? '[IMAGE_DATA]' : 'none' });
  console.log('User:', req.user);
  
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    


    // Validate input
    if (!receiverId) {
      console.error(`[${requestId}] Error: No receiver ID provided`);
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (!text && !image) {
      console.error(`[${requestId}] Error: Message must have text or image`);
      return res.status(400).json({ error: "Message must have text or image" });
    }

    // Process image if present
    let imageUrl;
    if (image) {
      try {
        console.log(`[${requestId}] Uploading image to Cloudinary...`);
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: 'auto',
          folder: 'chat_app'
        });
        imageUrl = uploadResponse.secure_url;
        console.log(`[${requestId}] Image uploaded successfully:`, imageUrl);
      } catch (uploadError) {
        // Enhanced error logging
        console.error(`[${requestId}] Error uploading image:`, uploadError);
        if (uploadError && uploadError.error) {
          console.error(`[${requestId}] Cloudinary error details:`, uploadError.error);
        }
        // Return all error details for debugging
        return res.status(500).json({ 
          error: "Failed to upload image",
          details: uploadError.message,
          cloudinaryError: uploadError.error || null,
          stack: uploadError.stack || null,
          receivedImageType: typeof image,
          receivedImageStart: typeof image === 'string' ? image.slice(0, 30) : null,
          receivedImageLength: typeof image === 'string' ? image.length : null
        });
      }
    }

    // Create and save message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || '',
      image: imageUrl,
    });

    console.log(`[${requestId}] Saving message to database...`);
    await newMessage.save();
    console.log(`[${requestId}] Message saved to DB:`, newMessage);

    // Get socket IDs
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId.toString());
    
    console.log(`[${requestId}] Socket IDs - `, {
      receiver: { id: receiverId, socketId: receiverSocketId },
      sender: { id: senderId, socketId: senderSocketId }
    });
    
    // Emit to receiver if online
    if (receiverSocketId) {
      console.log(`[${requestId}] Emitting newMessage to receiver:`, receiverSocketId);
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        isNew: true,
        timestamp: Date.now()
      });
    } else {
      console.log(`[${requestId}] Receiver is offline, message will be delivered on next connection`);
    }
    
    // Emit to sender if different from receiver
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      console.log(`[${requestId}] Emitting newMessage to sender:`, senderSocketId);
      io.to(senderSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        isNew: true,
        timestamp: Date.now()
      });
    } else if (senderSocketId === receiverSocketId) {
      console.log(`[${requestId}] Sender and receiver are the same, not sending duplicate event`);
    } else {
      console.log(`[${requestId}] Sender is offline, only saving to database`);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] Request completed in ${responseTime}ms`);
    
    res.status(201).json({
      ...newMessage.toObject(),
      requestId,
      responseTime: `${responseTime}ms`
    });
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[${requestId}] Error in sendMessage controller (${errorTime}ms):`, error);
    
    res.status(500).json({ 
      error: "Failed to send message",
      message: error.message,
      requestId,
      responseTime: `${errorTime}ms`
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // If the message had an image, delete it from Cloudinary
    if (message.image) {
      const publicId = message.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Emit message deleted event to both users
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }
    
    // Also emit to sender's socket
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
