import mongoose from "mongoose";

const AdminSchema = mongoose.Schema({
    accessName: {
        type: String,
        required: true,
        unique: true,
    },
    adminKey: {
        type: String,
        required: true,
    },  
    password: {
        type: String,
        required: true,
    },
    adminName: {
        type: String,
        required: false,
    },
}, {
    timestamps: true
});


const AdminModel = mongoose.model("admins", AdminSchema);

export default AdminModel; 