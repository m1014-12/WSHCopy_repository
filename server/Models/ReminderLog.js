import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema({
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
    dateSent: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        required: true,
    },
    errorMessage: {
        type: String,
        required: false, // Only populated if status is 'failed'
    },
    relatedItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Can be warranty ID, subscription ID, or home task ID
    },
    relatedItemName: {
        type: String,
        required: true, // Name of the warranty, subscription, or task
    },
    userEmail: {
        type: String,
        required: true,
    }
});

const ReminderLogModel = mongoose.model("reminderLogs", reminderLogSchema);

export default ReminderLogModel;
