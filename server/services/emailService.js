import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter for sending emails
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // You can change this to your preferred email service
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASS  // Your email password or app password
        }
    });
};

// Send warranty expiration reminder
export const sendWarrantyReminder = async (userEmail, username, warrantyName, expirationDate) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Warranty expiration remainder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Warranty Expiration Reminder</h2>
                    <p>Dear ${username},</p>
                    <p>We hope you are having a good day.<p/>
                    <p> Your warranty for <strong>${warrantyName}</strong> expires on <strong>${expirationDate}</strong>.</p>
                    <p>Please make sure to renew or take necessary action before the expiration date.</p>
                    <br>
                    <p>Best regards,<br>Your WSH-APP Management Team</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending warranty reminder:', error);
        return { success: false, error: error.message };
    }
};

// Send subscription renewal reminder
export const sendSubscriptionReminder = async (userEmail, username, subscriptionName, renewalDate) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Subscription renewal reminder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Subscription Renewal Reminder</h2>
                    <p>Dear ${username},</p>
                    <p>We hope you are having a good day.<p/>
                    <p> Your <strong>${subscriptionName}</strong> subscription renews on <strong>${renewalDate}</strong>.</p>
                    <p>Please ensure your payment method is up to date for automatic renewal.</p>
                    <br>
                    <p>Best regards,<br>Your WSH-APP Management Team</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending subscription reminder:', error);
        return { success: false, error: error.message };
    }
};

// Send home maintenance task reminder
export const sendMaintenanceReminder = async (userEmail, username, taskName, priority, description) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Home tasks remainder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Home Maintenance Task Reminder</h2>
                    <p>Dear ${username},</p>
                    <p>We hope you are having a good day.<p/>
                    <p> <strong>${taskName}</strong> maintenance is scheduled for today.</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    <p><strong>Description:</strong> ${description}</p>
                    <p>Please make sure to complete this task as scheduled.</p>
                    <br>
                    <p>Best regards,<br>Your WSH-APP Management Team</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending maintenance reminder:', error);
        return { success: false, error: error.message };
    }
};

// Generic email sending function
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};
