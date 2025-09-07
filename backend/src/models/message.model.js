import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },

  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


const Message = mongoose.model("Message", messageSchema);

export default Message;
