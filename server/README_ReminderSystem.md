# Reminder System Setup Guide

## Overview
The reminder system automatically sends email notifications to users for:
- Warranty expirations
- Subscription renewals  
- Home maintenance tasks

## Features
- **Automatic Scheduling**: Runs every 5 hours to check for upcoming reminders
- **Email Notifications**: Sends personalized email reminders to users
- **Database Storage**: Stores notifications in the database for the notifications page
- **Admin Logging**: Tracks all email reminders sent with success/failure status
- **User Management**: Users can view, mark as read, and delete notifications

## Setup Instructions

### 1. Environment Variables
Add these environment variables to your `.env` file:

```env
# Email Configuration for Reminder System
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT Secret (if not already set)
JWT_SECRET=your-jwt-secret-key-here
```

### 2. Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS` in your .env file

### 3. Database Models
The system uses these new models:
- `Notification`: Stores user notifications
- `ReminderLog`: Tracks email reminder logs for admin

### 4. API Endpoints

#### User Notification APIs
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/count` - Get unread notification count

#### Admin Reminder Log APIs
- `GET /admin/reminder-logs` - Get all reminder logs with pagination
- `GET /admin/reminder-stats` - Get reminder statistics

## How It Works

### Warranty Reminders
- Users set "remind me before" days when adding warranties
- System calculates reminder date: `expirationDate - remindBeforeDays`
- Sends email when current date matches reminder date

### Subscription Reminders  
- Users set "remind me before" days when adding subscriptions
- System calculates reminder date: `renewalDate - remindBeforeDays`
- Sends email when current date matches reminder date

### Home Task Reminders
- Users set reminder date when adding home tasks
- System sends email when current date matches reminder date

## Email Templates

### Warranty Expiration
- **Subject**: "Warranty expiration remainder"
- **Message**: "Dear {username}, we hope you are having a good day. Your warranty for {warrantyName} expires on {expirationDate}."

### Subscription Renewal
- **Subject**: "Subscription renewal reminder"  
- **Message**: "Dear {username}, We hope you are having a good day. Your {subscriptionName} subscription renews on {renewalDate}."

### Home Maintenance
- **Subject**: "Home tasks remainder"
- **Message**: "Dear {username}, We hope you are having a good day. {taskName} maintenance is scheduled for today. The priority is {priority}. This task will have {description}."

## Scheduler
- Runs every 5 hours automatically
- Starts when server connects to MongoDB
- Logs all activities to console
- Handles errors gracefully

## Admin Monitoring
Admins can monitor the reminder system through:
- Reminder logs with success/failure status
- Statistics showing success rates
- Filtering by type, status, and user
- Pagination for large datasets

## Testing
To test the reminder system:
1. Add a warranty/subscription/task with a reminder date set to today
2. Wait for the next scheduler run (or restart server)
3. Check email and notifications page
4. Review admin reminder logs

## Troubleshooting
- Check email credentials in .env file
- Verify Gmail app password is correct
- Check server logs for scheduler errors
- Ensure MongoDB connection is working
- Verify user email addresses are valid
