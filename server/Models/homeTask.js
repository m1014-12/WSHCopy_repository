import mongoose from "mongoose";

const homeTaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    homeTaskName: {
        type: String,
        required: true,
    },
    homeTaskCategory: {
        type: String,
        required: true,
    },
    homeTaskReminderDate: {
        type: Date,
        required: true,
    },
    homeTaskNotification: {
        type: String,
        required: false,
        default: '',
    },
    homeTaskDescription: {
        type: String,
        required: false,
        default: '',
    },
    homeTaskPriority: {
        type: String,
        required: true,
    },
    homeTaskEstimatedDuration: {
        type: Number,
        required: true,
    },
    homeTaskCost: {
        type: Number,
        required: false,
        default: 0,
    },
    homeTaskStatus: {
        type: String,
        required: true,
    },
    homeTaskCompleted: {
        type: Boolean,
        required: true,
    },
    serviceProviderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'serviceProviders',
        required: false,
    },
});

const HomeTaskModel = mongoose.model("homeTasks", homeTaskSchema);

export default HomeTaskModel;