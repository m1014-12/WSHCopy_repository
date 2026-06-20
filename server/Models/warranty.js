import mongoose from "mongoose";

const warrantySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true, // Add index for faster queries
    },
    warrantyName: {
        type: String,
        required: true,
    },
    warrantyCategory: {
        type: String,
        required: true,
        index: true, // Add index for category filtering
    },
    warrantyExpirationDate: {
        type: Date,
        required: true,
        index: true, // Add index for date sorting and filtering
    },
    warrantyImage: {
        type: String,
        required: false,
    },
    warrantyFile: {
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true }
    },
    warrantyRemindBefore: {
        type: String,
        required: false,
    },
}, {
    timestamps: true // Add createdAt and updatedAt timestamps
});

// Compound index for efficient user-specific queries
warrantySchema.index({ userId: 1, warrantyExpirationDate: 1 });

const WarrantyModel = mongoose.model("warranties", warrantySchema);

export default WarrantyModel;