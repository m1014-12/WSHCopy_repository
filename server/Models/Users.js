import mongoose from "mongoose";

const UsersSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },  
    phoneNumber: {
        type: String,
        required: true,
        unique: true,  
    },
    password: {
        type: String,
        required: true,
    },
    resetToken: {
        type: String,
    },
    resetTokenExpiration: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, {
    timestamps: true  // This automatically adds createdAt and updatedAt fields
});


const UsersModel = mongoose.model("users", UsersSchema);

export default UsersModel; 