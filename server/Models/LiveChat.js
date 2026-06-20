import mongoose from "mongoose";

const LiveChatMessageSchema = mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    enum: ['users', 'admins'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const LiveChatSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admins',
    default: null
  },
  messages: [LiveChatMessageSchema],
  status: {
    type: String,
    enum: ['pending', 'active', 'resolved', 'closed'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
LiveChatSchema.index({ userId: 1, status: 1 });
LiveChatSchema.index({ adminId: 1, status: 1 });
LiveChatSchema.index({ lastMessageAt: -1 });

const LiveChatModel = mongoose.model("livechats", LiveChatSchema);

export default LiveChatModel;

