import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        enum: ['warranty', 'subscription', 'homeTask']
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        default: null  // null means it's a parent category
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
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

// Create compound index to prevent duplicate categories
// Parent categories: unique name + category + null parentId
// Subcategories: unique name + category + parentId
categorySchema.index({ name: 1, category: 1, parentId: 1 }, { unique: true });

const CategoryModel = mongoose.model("categories", categorySchema);

export default CategoryModel;
