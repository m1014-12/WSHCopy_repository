import mongoose from "mongoose";

const serviceProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    contactName: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        maxlength: 20
    },
    email: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    address: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxlength: 1000
    },
    rating: {
        type: Number,
        required: false,
        min: 0,
        max: 5,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admins',
        required: true
    }
}, {
    timestamps: true
});

// Create index for efficient filtering by category and location
serviceProviderSchema.index({ category: 1, location: 1 });
serviceProviderSchema.index({ isActive: 1 });

const ServiceProviderModel = mongoose.model("serviceProviders", serviceProviderSchema);

export default ServiceProviderModel;

