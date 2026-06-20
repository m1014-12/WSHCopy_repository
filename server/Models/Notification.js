import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    type: {
        type: String,
        enum: ['warranty', 'subscription', 'maintenance'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    relatedItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Can be warranty ID, subscription ID, or home task ID
    },
    relatedItemName: {
        type: String,
        required: true, // Name of the warranty, subscription, or task
    },
    dueDate: {
        type: Date,
        required: true, // The actual due date for the item
    }
});

const NotificationModel = mongoose.model("notifications", notificationSchema);

export default NotificationModel;
