import cron from 'node-cron';
import WarrantyModel from '../Models/warranty.js';
import SubscriptionModel from '../Models/subscription.js';
import HomeTaskModel from '../Models/homeTask.js';
import UsersModel from '../Models/Users.js';
import NotificationModel from '../Models/Notification.js';
import ReminderLogModel from '../Models/ReminderLog.js';
import { 
    sendWarrantyReminder, 
    sendSubscriptionReminder, 
    sendMaintenanceReminder 
} from './emailService.js';

// Helper function to calculate reminder date based on "remind before" setting
const calculateReminderDate = (dueDate, remindBefore) => {
    const due = new Date(dueDate);
    const remindBeforeDays = parseInt(remindBefore) || 0;
    const reminderDate = new Date(due);
    reminderDate.setDate(due.getDate() - remindBeforeDays);
    return reminderDate;
};

// Helper function to format date for display
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Check and send warranty expiration reminders
const checkWarrantyReminders = async () => {
    try {
        console.log('Checking warranty reminders...');
        
        const warranties = await WarrantyModel.find({
            warrantyRemindBefore: { $exists: true, $ne: null, $ne: '' }
        }).populate('userId', 'userName email');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const warranty of warranties) {
            const reminderDate = calculateReminderDate(
                warranty.warrantyExpirationDate, 
                warranty.warrantyRemindBefore
            );
            reminderDate.setHours(0, 0, 0, 0);

            // Check if today is the reminder date
            if (reminderDate.getTime() === today.getTime()) {
                const user = warranty.userId;
                
                // Skip if user is null or doesn't exist
                if (!user || !user._id) {
                    console.log(`Skipping warranty reminder - user not found for warranty ${warranty._id}`);
                    continue;
                }
                
                const expirationDateFormatted = formatDate(warranty.warrantyExpirationDate);
                
                // Check if reminder has already been sent for this warranty today
                const existingReminder = await ReminderLogModel.findOne({
                    userId: user._id,
                    type: 'warranty',
                    relatedItemId: warranty._id,
                    dateSent: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                    },
                    status: 'sent'
                });

                if (existingReminder) {
                    console.log(`Warranty reminder already sent today for ${user.userName} - ${warranty.warrantyName}`);
                    continue;
                }
                
                // Send email reminder
                const emailResult = await sendWarrantyReminder(
                    user.email,
                    user.userName,
                    warranty.warrantyName,
                    expirationDateFormatted
                );

                // Create notification in database
                const notification = new NotificationModel({
                    userId: user._id,
                    type: 'warranty',
                    title: 'Warranty Expiration Reminder',
                    message: `Dear ${user.userName}, we hope you are having a good day. Your warranty for ${warranty.warrantyName} expires on ${expirationDateFormatted}.`,
                    relatedItemId: warranty._id,
                    relatedItemName: warranty.warrantyName,
                    dueDate: warranty.warrantyExpirationDate
                });
                await notification.save();

                // Log the reminder
                const reminderLog = new ReminderLogModel({
                    userId: user._id,
                    type: 'warranty',
                    title: 'Warranty expiration remainder',
                    message: `Dear ${user.userName}, we hope you are having a good day. Your warranty for ${warranty.warrantyName} expires on ${expirationDateFormatted}.`,
                    status: emailResult.success ? 'sent' : 'failed',
                    errorMessage: emailResult.success ? null : emailResult.error,
                    relatedItemId: warranty._id,
                    relatedItemName: warranty.warrantyName,
                    userEmail: user.email
                });
                await reminderLog.save();

                console.log(`Warranty reminder ${emailResult.success ? 'sent' : 'failed'} for ${user.userName} - ${warranty.warrantyName}`);
            }
        }
    } catch (error) {
        console.error('Error checking warranty reminders:', error);
    }
};

// Check and send subscription renewal reminders
const checkSubscriptionReminders = async () => {
    try {
        console.log('Checking subscription reminders...');
        
        const subscriptions = await SubscriptionModel.find({
            subscriptionRemindBefore: { $exists: true, $ne: null, $ne: '' }
        }).populate('userId', 'userName email');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const subscription of subscriptions) {
            const reminderDate = calculateReminderDate(
                subscription.subscriptionRenewalDate, 
                subscription.subscriptionRemindBefore
            );
            reminderDate.setHours(0, 0, 0, 0);

            // Check if today is the reminder date
            if (reminderDate.getTime() === today.getTime()) {
                const user = subscription.userId;
                
                // Skip if user is null or doesn't exist
                if (!user || !user._id) {
                    console.log(`Skipping subscription reminder - user not found for subscription ${subscription._id}`);
                    continue;
                }
                
                const renewalDateFormatted = formatDate(subscription.subscriptionRenewalDate);
                
                // Check if reminder has already been sent for this subscription today
                const existingReminder = await ReminderLogModel.findOne({
                    userId: user._id,
                    type: 'subscription',
                    relatedItemId: subscription._id,
                    dateSent: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                    },
                    status: 'sent'
                });

                if (existingReminder) {
                    console.log(`Subscription reminder already sent today for ${user.userName} - ${subscription.subscriptionName}`);
                    continue;
                }
                
                // Send email reminder
                const emailResult = await sendSubscriptionReminder(
                    user.email,
                    user.userName,
                    subscription.subscriptionName,
                    renewalDateFormatted
                );

                // Create notification in database
                const notification = new NotificationModel({
                    userId: user._id,
                    type: 'subscription',
                    title: 'Subscription Renewal Reminder',
                    message: `Dear ${user.userName}, We hope you are having a good day. Your ${subscription.subscriptionName} subscription renews on ${renewalDateFormatted}.`,
                    relatedItemId: subscription._id,
                    relatedItemName: subscription.subscriptionName,
                    dueDate: subscription.subscriptionRenewalDate
                });
                await notification.save();

                // Log the reminder
                const reminderLog = new ReminderLogModel({
                    userId: user._id,
                    type: 'subscription',
                    title: 'Subscription renewal reminder',
                    message: `Dear ${user.userName}, We hope you are having a good day. Your ${subscription.subscriptionName} subscription renews on ${renewalDateFormatted}.`,
                    status: emailResult.success ? 'sent' : 'failed',
                    errorMessage: emailResult.success ? null : emailResult.error,
                    relatedItemId: subscription._id,
                    relatedItemName: subscription.subscriptionName,
                    userEmail: user.email
                });
                await reminderLog.save();

                console.log(`Subscription reminder ${emailResult.success ? 'sent' : 'failed'} for ${user.userName} - ${subscription.subscriptionName}`);
            }
        }
    } catch (error) {
        console.error('Error checking subscription reminders:', error);
    }
};

// Check and send home maintenance task reminders
const checkMaintenanceReminders = async () => {
    try {
        console.log('Checking maintenance reminders...');
        
        const homeTasks = await HomeTaskModel.find({
            homeTaskReminderDate: { $exists: true, $ne: null }
        }).populate('userId', 'userName email');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const task of homeTasks) {
            const reminderDate = new Date(task.homeTaskReminderDate);
            reminderDate.setHours(0, 0, 0, 0);

            // Check if today is the reminder date
            if (reminderDate.getTime() === today.getTime()) {
                const user = task.userId;
                
                // Skip if user is null or doesn't exist
                if (!user || !user._id) {
                    console.log(`Skipping maintenance reminder - user not found for task ${task._id}`);
                    continue;
                }
                
                // Check if reminder has already been sent for this home task today
                const existingReminder = await ReminderLogModel.findOne({
                    userId: user._id,
                    type: 'maintenance',
                    relatedItemId: task._id,
                    dateSent: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                    },
                    status: 'sent'
                });

                if (existingReminder) {
                    console.log(`Maintenance reminder already sent today for ${user.userName} - ${task.homeTaskName}`);
                    continue;
                }
                
                // Send email reminder
                const emailResult = await sendMaintenanceReminder(
                    user.email,
                    user.userName,
                    task.homeTaskName,
                    task.homeTaskPriority,
                    task.homeTaskDescription || 'No description provided'
                );

                // Create notification in database
                const notification = new NotificationModel({
                    userId: user._id,
                    type: 'maintenance',
                    title: 'Home Maintenance Task Reminder',
                    message: `Dear ${user.userName}, We hope you are having a good day. ${task.homeTaskName} maintenance is scheduled for today. The priority is ${task.homeTaskPriority}. This task will have ${task.homeTaskDescription || 'no description'}`,
                    relatedItemId: task._id,
                    relatedItemName: task.homeTaskName,
                    dueDate: task.homeTaskReminderDate
                });
                await notification.save();

                // Log the reminder
                const reminderLog = new ReminderLogModel({
                    userId: user._id,
                    type: 'maintenance',
                    title: 'Home tasks remainder',
                    message: `Dear ${user.userName}, We hope you are having a good day. ${task.homeTaskName} maintenance is scheduled for today. The priority is ${task.homeTaskPriority}. This task will have ${task.homeTaskDescription || 'no description'}`,
                    status: emailResult.success ? 'sent' : 'failed',
                    errorMessage: emailResult.success ? null : emailResult.error,
                    relatedItemId: task._id,
                    relatedItemName: task.homeTaskName,
                    userEmail: user.email
                });
                await reminderLog.save();

                console.log(`Maintenance reminder ${emailResult.success ? 'sent' : 'failed'} for ${user.userName} - ${task.homeTaskName}`);
            }
        }
    } catch (error) {
        console.error('Error checking maintenance reminders:', error);
    }
};

// Main function to check all reminders
const checkAllReminders = async () => {
    console.log(`Starting reminder check at ${new Date().toISOString()}`);
    
    try {
        await Promise.all([
            checkWarrantyReminders(),
            checkSubscriptionReminders(),
            checkMaintenanceReminders()
        ]);
        
        console.log('Reminder check completed successfully');
    } catch (error) {
        console.error('Error in reminder check:', error);
    }
};

// Start the scheduler
export const startReminderScheduler = () => {
    console.log('Starting reminder scheduler...');
    
    // Run immediately on startup
    checkAllReminders();
    
        // Schedule to run every 10 minutes using cron
        // Cron format: '*/10 * * * *' means every 10 minutes
        const task = cron.schedule('*/10 * * * *', () => {
            console.log('Running scheduled reminder check...');
            checkAllReminders();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('Reminder scheduler started - will run every 10 minutes using cron');
    
    return task;
};

// Export for manual testing
export { checkAllReminders, checkWarrantyReminders, checkSubscriptionReminders, checkMaintenanceReminders };
