import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    subscriptionName: {
        type: String,
        required: true,
    },
    subscriptionCategory: {
        type: String,
        required: true,
    },
    subscriptionRenewalDate: {
        type: Date,
        required: true,
    },
    subscriptionRemindBefore: {
        type: String,
        required: true,
        default: '7',
    },
    subscriptionAutoRenewal: {
        type: Boolean,
        required: true,
    },
    subscriptionDescription: {
        type: String,
        required: false,
    },
    subscriptionPrice: {
        type: Number,
        required: true,
    },
    subscriptionBillingCycle: {
        type: String,
        required: true,
    },
});

const SubscriptionModel = mongoose.model("subscriptions", subscriptionSchema);

export default SubscriptionModel;