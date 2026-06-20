import mongoose from "mongoose";

const ChatMessageSchema = mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  messages: [ChatMessageSchema],
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated'],
    default: 'active'
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const ChatModel = mongoose.model("chats", ChatSchema);

export default ChatModel;

