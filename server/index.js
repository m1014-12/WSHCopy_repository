//RUN SERVER:npm run dev
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import UsersModel from "./Models/Users.js";
import AdminModel from "./Models/Admin.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import nodemailer from "nodemailer";
import emailjs from 'emailjs-com';
import ('dotenv'); 
import WarrantyModel from "./Models/warranty.js";
import SubscriptionModel from "./Models/subscription.js";
import HomeTaskModel from "./Models/homeTask.js";
import CategoryModel from "./Models/Category.js";
import NotificationModel from "./Models/Notification.js";
import ReminderLogModel from "./Models/ReminderLog.js";
import ChatModel from "./Models/Chat.js";
import LiveChatModel from "./Models/LiveChat.js";
import ServiceProviderModel from "./Models/ServiceProvider.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";
import { getChatbotResponse, getSuggestions } from "./services/chatbotService.js";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

dotenv.config();

app.use(express.json());

app.use(cors());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Reduced to 5MB limit for better performance
  },
  fileFilter: (req, file, cb) => {
    // Allow all image types and documents
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|svg|tiff|ico|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    
    // Check MIME types - accept all image types
    const isImage = file.mimetype.startsWith('image/');
    const allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const isAllowedDocument = allowedDocumentTypes.includes(file.mimetype);
    
    if ((isImage || isAllowedDocument) && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (all formats), PDF, Word documents, and text files are allowed!'));
    }
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error.message.includes('Only images')) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId || decoded.adminId;
    socket.userType = decoded.userId ? 'user' : 'admin';
    socket.userRole = decoded.role || 'user';
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.userType})`);
  console.log(`Socket ID: ${socket.id}`);
  
  // Join user's personal room
  if (socket.userType === 'user') {
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} joined room: user_${socket.userId}`);
  } else if (socket.userType === 'admin') {
    socket.join('admin_room');
    console.log(`Admin ${socket.userId} joined room: admin_room`);
    // Log all sockets in admin_room
    io.in('admin_room').fetchSockets().then(sockets => {
      console.log(`Total admins in admin_room: ${sockets.length}`);
    });
  }
  
  // Handle new message from user
  socket.on('user_message', async (data) => {
    try {
      const { chatId, message } = data;
      
      // Find or create chat
      let chat = await LiveChatModel.findById(chatId);
      if (!chat) {
        chat = new LiveChatModel({
          userId: socket.userId,
          status: 'pending',
          messages: []
        });
      }
      
      // Add message
      chat.messages.push({
        senderId: socket.userId,
        senderType: 'users',
        content: message,
        read: false
      });
      
      chat.status = chat.status === 'pending' ? 'active' : chat.status;
      chat.lastMessageAt = new Date();
      
      await chat.save();
      
      // Emit to admin room - send the full message object
      const savedMessage = chat.messages[chat.messages.length - 1];
      const messageData = {
        chatId: chat._id.toString(),
        userId: socket.userId.toString(),
        message: {
          _id: savedMessage._id?.toString() || savedMessage._id,
          senderId: savedMessage.senderId?.toString() || savedMessage.senderId,
          senderType: savedMessage.senderType || 'users',
          content: savedMessage.content,
          timestamp: savedMessage.timestamp || new Date(),
          read: savedMessage.read || false
        }
      };
      
      console.log('Emitting new_message to admin_room:', messageData);
      
      // Check how many admins are in the room
      const adminSockets = await io.in('admin_room').fetchSockets();
      console.log(`Sending to ${adminSockets.length} admin(s) in admin_room`);
      
      io.to('admin_room').emit('new_message', messageData);
      
      // Confirm to user
      socket.emit('message_sent', {
        chatId: chat._id,
        messageId: chat.messages[chat.messages.length - 1]._id
      });
    } catch (error) {
      console.error('Error handling user message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle admin message
  socket.on('admin_message', async (data) => {
    try {
      const { chatId, message, userId } = data;
      
      const chat = await LiveChatModel.findById(chatId);
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      // Add admin message
      chat.messages.push({
        senderId: socket.userId,
        senderType: 'admins',
        content: message,
        read: false
      });
      
      if (!chat.adminId) {
        chat.adminId = socket.userId;
      }
      
      chat.status = 'active';
      chat.lastMessageAt = new Date();
      
      await chat.save();
      
      // Emit to specific user
      io.to(`user_${userId}`).emit('new_message', {
        chatId: chat._id,
        message: {
          senderId: socket.userId,
          senderType: 'admins',
          content: message,
          timestamp: new Date()
        }
      });
      
      // Confirm to admin
      socket.emit('message_sent', {
        chatId: chat._id,
        messageId: chat.messages[chat.messages.length - 1]._id
      });
    } catch (error) {
      console.error('Error handling admin message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    if (socket.userType === 'user') {
      io.to('admin_room').emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    } else {
      io.to(`user_${data.userId}`).emit('admin_typing', {
        chatId: data.chatId
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

httpServer.listen(3001, () => {
    console.log("Server is running on port 3001");
    console.log("Socket.io is ready");
}); 

// Database connection

const connectString = 
    "mongodb+srv://alsalmimajd7_db_user:gToqfjEJxYusMswI@cluster0.fcvolod.mongodb.net/?appName=Cluster0";

mongoose.connect(connectString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
    // Start the reminder scheduler after successful database connection
    startReminderScheduler();
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});


const JWT_SECRET = 

  "ihzslofiozm;foijziwljf;OWRJ;wrj98325798 q0464jhtaklsdjtizetz[][]f[psd]w83y5235qyi3hauihfunvhia8qy4!@#$%%^**&3uhbgliawnrlvmdxfklachn";

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify admin still exists in database
    const admin = await AdminModel.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    req.admin = {
      id: admin._id,
      accessName: admin.accessName,
      email: admin.email
    };
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// check username

// User registration
app.post("/userRegister", async (req, res) => {
  console.log("Registration request received:", req.body);
  const {
    userName,
    password,
    confirmPassword,
    phoneNumber,
    email,

  } = req.body;

  // Validation: Check if all required fields exist
  if (
    !userName ||
    !email ||
    !password ||
    !confirmPassword ||
    !phoneNumber 
  ) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Username Validation: max 20 characters
  if (userName.length > 20) {
    return res.status(400).json({
      success: false,
      message: 'Username must not exceed 20 characters',
    });
  }

  // Passwords match check
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  // Password strength check (8-20 characters, uppercase, lowercase, number, symbol)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be 8-20 characters, include uppercase, lowercase, number, and symbol',
    });
  }

  // Phone number validation: starts with 9 or 7, exactly 8 digits
  const phoneRegex = /^[97][0-9]{7}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Phone number must start with 9 or 7 and be exactly 8 digits',
    });
  }

  try {
    // Check if email already exists
    const existingEmail = await UsersModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await UsersModel.findOne({ userName });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user to the database
    const user = new UsersModel({
      userName: userName,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      email: email,
  
    });

    await user.save();

    // Respond with success
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.', error: error.message });
  }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// User login 
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // Check if user exists
      const user = await UsersModel.findOne({email});

      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or username" });
      }

      // Compare the entered password with the stored hashed password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          userName: user.userName 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Login success
      res.status(200).json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});

// Admin login 
app.post("/adminLogin", async(req, res) =>{
    const accessName = req.body.accessName;
    const password = req.body.password;
    const adminKey = req.body.adminKey;

    try {
        const admin = await AdminModel.findOne({ accessName });
        if (!admin) return res.status(400).json({ success: false, message: "Admin not found" });
    
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) return res.status(400).json({ success: false, message: "Invalid Password" });
    
        if (adminKey !== admin.adminKey) {
          return res.status(400).json({ success: false, message: "Invalid Admin Key" });
        }
    
        // Generate JWT token for admin
        const token = jwt.sign(
          { 
            adminId: admin._id, 
            accessName: admin.accessName,
            role: 'admin' 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(200).json({ 
          success: true, 
          message: "Admin Login Successful",
          token: token,
          adminId: admin._id,
          accessName: admin.accessName,
          email: admin.email
        });
      } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
      } 

} );

// Admin profile endpoint (protected)
app.get("/admin/profile", authenticateAdmin, async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.admin.id).select('-password -adminKey');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      admin: {
        id: admin._id,
        accessName: admin.accessName,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Generate Token and Send Forgot password Email
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UsersModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        // Generate a secure token
        const Stoken = crypto.randomBytes(32).toString("hex");
        
        // Create a signed JWT with the user ID and email
        const token = jwt.sign(
          { email: user.email, id: user._id.toString() },
          process.env.JWT_SECRET,  // Use a fixed secret from env
          { expiresIn: "30m" }
        );

        // Store the token and expiration date in the user model
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();        

        // Generate the link
        const resetLink = `http://localhost:3000/reset-password/${user._id}/${token}`;
        console.log(resetLink);     

        // Send email with the reset link
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. The link is valid for 30 minutes.</p>`
        });
        res.json({ message: "Reset link sent to your email" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Password Reset
app.post("/reset-password/:id/:token", async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { id, token } = req.params;

  try {
    console.log("Reset Password Request:", req.params);
    console.log("Received ID:", id);

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    } else {
      console.log("ObjectId format is valid");
    }

    // Find user by ID
    const user = await UsersModel.findOne({ _id: id });
    console.log("User from DB:", user);

    if (!user) {
      console.log("User not found in database");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User found. Checking token...");
    console.log("Database Token:", user.resetToken);
    console.log("URL Token:", token);

    // Validate the token
    if (!user.resetToken || user.resetToken !== token) {
      console.log("Token mismatch or expired");
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    console.log("Token is valid, proceeding to reset password...");

    // Verify the JWT
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      console.log("JWT verified successfully");
    } catch (error) {
      console.log("JWT verification failed");
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      console.log("Passwords do not match");
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Validate password strength (8-20 characters, uppercase, lowercase, number, and symbol)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    if (!passwordRegex.test(password)) {
      console.log("Password strength validation failed");
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-20 characters, include uppercase, lowercase, number, and symbol',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token & expiration
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    console.log("Password updated successfully");

    // Success response
    res.status(200).json({ success: true, message: 'Password successfully updated' });

  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Profile Management APIs

// Get user profile by ID
app.get("/profile/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    // Check if user is accessing their own profile
    if (req.user.userId !== id) {
      return res.status(403).json({ success: false, message: "Access denied. You can only view your own profile." });
    }

    // Find user by ID
    const user = await UsersModel.findById(id).select('-password -resetToken -resetTokenExpiration');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      user: {
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Update user profile
app.put("/profile/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userName, email, phoneNumber, password } = req.body;

  try {
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    // Check if user is updating their own profile
    if (req.user.userId !== id) {
      return res.status(403).json({ success: false, message: "Access denied. You can only update your own profile." });
    }

    // Find user by ID
    const user = await UsersModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Username Validation: max 20 characters
    if (userName && userName.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must not exceed 20 characters',
      });
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Phone number validation: starts with 9 or 7, exactly 8 digits
    if (phoneNumber && !/^[97][0-9]{7}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must start with 9 or 7 and be exactly 8 digits',
      });
    }

    // Password validation if provided
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be 8-20 characters, include uppercase, lowercase, number, and symbol',
        });
      }
    }

    // Check if email already exists (if changing email)
    if (email && email !== user.email) {
      const existingEmail = await UsersModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    // Check if username already exists (if changing username)
    if (userName && userName !== user.userName) {
      const existingUsername = await UsersModel.findOne({ userName });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }

    // Update user fields
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Warranty APIs

// Add Warranty
app.post("/addWarranty", authenticateToken, upload.single('warrantyFile'), async (req, res) => {
  try {
    const { 
      warrantyName,
      warrantyCategory,
      warrantyExpirationDate,
      warrantyRemindBefore
    } = req.body;

    if (
      !warrantyName ||
      !warrantyCategory || 
      !warrantyExpirationDate
    ) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Warranty file is required' });
    }

    const warrantyData = { 
      userId: req.user.userId, // Associate warranty with the authenticated user
      warrantyName: warrantyName, 
      warrantyCategory: warrantyCategory, 
      warrantyExpirationDate: warrantyExpirationDate, 
      warrantyRemindBefore: warrantyRemindBefore || '',
      warrantyImage: 'default-image' // Default image if no file uploaded
    };

    // If file is uploaded, store file data
    if (req.file) {
      warrantyData.warrantyFile = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size
      };
    }

    const warranty = new WarrantyModel(warrantyData);
    await warranty.save();
    
    res.status(200).json({ 
      message: 'Warranty added successfully',
      warrantyId: warranty._id
    });
  } catch (error) {
    console.error('Error adding warranty:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get Warranty
app.get("/getWarranty", authenticateToken, async (req, res) => {
  try {
    // Only get warranties for the authenticated user, exclude file data for performance
    const warranty = await WarrantyModel.find({ userId: req.user.userId })
      .select('-warrantyFile.data') // Exclude file buffer data
      .sort({ warrantyExpirationDate: 1 }); // Sort by expiration date
    res.status(200).json({ warranty });
  } catch (error) {
    res.status(400).json({ message: error.message });
  } 
});

// Delete Warranty
app.delete("/deleteWarranty/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the warranty belongs to the authenticated user
    const warranty = await WarrantyModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found or access denied' });
    }
    
    await WarrantyModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Warranty deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Warranty
app.put("/updateWarranty/:id", authenticateToken, upload.single('warrantyFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { warrantyName, warrantyCategory, warrantyExpirationDate, warrantyRemindBefore } = req.body;
    
    // First check if the warranty belongs to the authenticated user
    const existingWarranty = await WarrantyModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!existingWarranty) {
      return res.status(404).json({ message: 'Warranty not found or access denied' });
    }
    
    const updateData = { 
      warrantyName, 
      warrantyCategory, 
      warrantyExpirationDate, 
      warrantyRemindBefore: warrantyRemindBefore || ''
    };

    // If file is uploaded, update file data
    if (req.file) {
      updateData.warrantyFile = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size
      };
    }
    
    const warranty = await WarrantyModel.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: 'Warranty updated successfully' });
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get Warranty by ID
app.get("/getWarranty/:id", async (req, res) => {
  const { id } = req.params;
  const warranty = await WarrantyModel.findById(id);
  res.status(200).json({ warranty });

  try {
    const warranty = await WarrantyModel.findById(id);
    res.status(200).json({ warranty });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }

});

// Serve uploaded files
app.get("/warranty-file/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find warranty and check if user has access
    const warranty = await WarrantyModel.findOne({ 
      _id: id, 
      userId: req.user.userId 
    });
    
    if (!warranty || !warranty.warrantyFile) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': warranty.warrantyFile.contentType,
      'Content-Disposition': `inline; filename="${warranty.warrantyFile.originalName}"`,
      'Content-Length': warranty.warrantyFile.size
    });
    
    // Send file data
    res.send(warranty.warrantyFile.data);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Home Tasks APIs

// Add Home Task
app.post("/addHomeTask", authenticateToken, async (req, res) => {
  const { 
    homeTaskName,
    homeTaskCategory,
    homeTaskReminderDate,
    homeTaskNotification,
    homeTaskDescription,
    homeTaskPriority,
    homeTaskEstimatedDuration,
    homeTaskCost,
    homeTaskStatus,
    homeTaskCompleted,
    serviceProviderId
  } = req.body;

  if (
    !homeTaskName ||
    !homeTaskCategory || 
    !homeTaskReminderDate || 
    !homeTaskPriority ||
    !homeTaskEstimatedDuration ||
    !homeTaskStatus ||
    homeTaskCompleted === undefined
  ) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const homeTask = new HomeTaskModel({ 
    userId: req.user.userId, // Associate task with the authenticated user
    homeTaskName: homeTaskName, 
    homeTaskCategory: homeTaskCategory, 
    homeTaskReminderDate: homeTaskReminderDate, 
    homeTaskNotification: homeTaskNotification || '', 
    homeTaskDescription: homeTaskDescription || '',
    homeTaskPriority: homeTaskPriority,
    homeTaskEstimatedDuration: homeTaskEstimatedDuration,
    homeTaskCost: homeTaskCost || 0,
    homeTaskStatus: homeTaskStatus,
    homeTaskCompleted: homeTaskCompleted,
    serviceProviderId: serviceProviderId || null
  });
  try {
  await homeTask.save();
  res.status(200).json({ 
    message: 'Home task added successfully' 
  });
  } catch (error) {
  res.status(400).json({ message: error.message });
  }

});

// Get Home Tasks
app.get("/getHomeTasks", authenticateToken, async (req, res) => {
  try {
    // Only get tasks for the authenticated user
    const homeTasks = await HomeTaskModel.find({ userId: req.user.userId });
    res.status(200).json({ homeTasks });
  } catch (error) {
    res.status(400).json({ message: error.message });
  } 
});

// Delete Home Task
app.delete("/deleteHomeTask/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // First check if the task belongs to the authenticated user
    const homeTask = await HomeTaskModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!homeTask) {
      return res.status(404).json({ message: 'Home task not found or access denied' });
    }
    
    await HomeTaskModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Home task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Home Task
app.put("/updateHomeTask/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { 
    homeTaskName, 
    homeTaskCategory, 
    homeTaskReminderDate, 
    homeTaskNotification, 
    homeTaskDescription,
    homeTaskPriority,
    homeTaskEstimatedDuration,
    homeTaskCost,
    homeTaskStatus,
    homeTaskCompleted,
    serviceProviderId
  } = req.body;
  try {
    // First check if the task belongs to the authenticated user
    const existingTask = await HomeTaskModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Home task not found or access denied' });
    }
    
    const updateData = { 
      homeTaskName, 
      homeTaskCategory, 
      homeTaskReminderDate, 
      homeTaskNotification: homeTaskNotification || '', 
      homeTaskDescription: homeTaskDescription || '',
      homeTaskPriority,
      homeTaskEstimatedDuration,
      homeTaskCost: homeTaskCost || 0,
      homeTaskStatus,
      homeTaskCompleted
    };
    
    if (serviceProviderId !== undefined) {
      updateData.serviceProviderId = serviceProviderId || null;
    }
    
    const homeTask = await HomeTaskModel.findByIdAndUpdate(id, updateData);
    res.status(200).json({ message: 'Home task updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Home Task by ID
app.get("/getHomeTask/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const homeTask = await HomeTaskModel.findById(id);
    res.status(200).json({ homeTask });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Subscription APIs

// Add Subscription
app.post("/addSubscription", authenticateToken, async (req, res) => {
  const { 
    subscriptionName,
    subscriptionCategory,
    subscriptionRenewalDate,
    subscriptionRemindBefore,
    subscriptionAutoRenewal,
    subscriptionDescription,
    subscriptionPrice,
    subscriptionBillingCycle
  } = req.body;

  if (
    !subscriptionName ||
    !subscriptionCategory || 
    !subscriptionRenewalDate || 
    subscriptionAutoRenewal === undefined || 
    !subscriptionPrice ||
    !subscriptionBillingCycle
  ) {
    return res.status(400).json({ message: 'Name, category, renewal date, auto renewal, price, and billing cycle are required' });
  }

  const subscription = new SubscriptionModel({ 
    userId: req.user.userId, // Associate subscription with the authenticated user
    subscriptionName: subscriptionName, 
    subscriptionCategory: subscriptionCategory, 
    subscriptionRenewalDate: subscriptionRenewalDate,
    subscriptionRemindBefore: subscriptionRemindBefore || '7',
    subscriptionAutoRenewal: subscriptionAutoRenewal, 
    subscriptionDescription: subscriptionDescription,
    subscriptionPrice: subscriptionPrice,
    subscriptionBillingCycle: subscriptionBillingCycle
  });
  try {
  await subscription.save();
  res.status(200).json({ 
    message: 'Subscription added successfully' 
  });
  } catch (error) {
  res.status(400).json({ message: error.message });
  }

});

// Get Subscriptions
app.get("/getSubscriptions", authenticateToken, async (req, res) => {
  try {
    // Only get subscriptions for the authenticated user
    const subscriptions = await SubscriptionModel.find({ userId: req.user.userId });
    res.status(200).json({ subscriptions });
  } catch (error) {
    res.status(400).json({ message: error.message });
  } 
});

// Delete Subscription
app.delete("/deleteSubscription/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // First check if the subscription belongs to the authenticated user
    const subscription = await SubscriptionModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found or access denied' });
    }
    
    await SubscriptionModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Subscription
app.put("/updateSubscription/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { 
    subscriptionName, 
    subscriptionCategory, 
    subscriptionRenewalDate,
    subscriptionRemindBefore,
    subscriptionAutoRenewal, 
    subscriptionDescription,
    subscriptionPrice,
    subscriptionBillingCycle
  } = req.body;
  try {
    // First check if the subscription belongs to the authenticated user
    const existingSubscription = await SubscriptionModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!existingSubscription) {
      return res.status(404).json({ message: 'Subscription not found or access denied' });
    }
    
    const subscription = await SubscriptionModel.findByIdAndUpdate(id, { 
      subscriptionName, 
      subscriptionCategory, 
      subscriptionRenewalDate,
      subscriptionRemindBefore: subscriptionRemindBefore || '7',
      subscriptionAutoRenewal, 
      subscriptionDescription,
      subscriptionPrice,
      subscriptionBillingCycle
    });
    res.status(200).json({ message: 'Subscription updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Subscription by ID
app.get("/getSubscription/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const subscription = await SubscriptionModel.findById(id);
    res.status(200).json({ subscription });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin APIs

// Get all users (for admin)
app.get("/admin/users", async (req, res) => {
  try {
    const users = await UsersModel.find({}).select('-password -resetToken -resetTokenExpiration');
    res.status(200).json({ 
      success: true, 
      users: users.map(user => ({
        id: user._id,
        username: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status || 'active',
        registrationDate: user.createdAt || new Date().toISOString().split('T')[0],
        avatar: user.userName ? user.userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
app.delete("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await UsersModel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (admin only)
app.put("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { userName, email, phoneNumber, status } = req.body;

  try {
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    // Find user by ID
    const user = await UsersModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Username Validation: max 20 characters
    if (userName && userName.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must not exceed 20 characters',
      });
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Phone number validation: starts with 9 or 7, exactly 8 digits
    if (phoneNumber && !/^[97][0-9]{7}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must start with 9 or 7 and be exactly 8 digits',
      });
    }

    // Check if email already exists (if changing email)
    if (email && email !== user.email) {
      const existingEmail = await UsersModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    // Check if username already exists (if changing username)
    if (userName && userName !== user.userName) {
      const existingUsername = await UsersModel.findOne({ userName });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }

    // Update user fields
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (status) user.status = status;

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status || 'active',
        registrationDate: user.createdAt || new Date().toISOString().split('T')[0],
        avatar: user.userName ? user.userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Admin Management APIs

// Get all admins (super admin only)
app.get("/admin/admins", authenticateAdmin, async (req, res) => {
  try {
    // Check if current admin is super admin (accessName: 'admin')
    if (req.admin.accessName !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only super admin can manage other admins.' 
      });
    }

    const admins = await AdminModel.find({}).select('-password -adminKey');
    res.status(200).json({ 
      success: true, 
      admins: admins.map(admin => ({
        id: admin._id,
        accessName: admin.accessName,
        adminName: admin.adminName || admin.accessName, // Use adminName if available, fallback to accessName
        createdAt: admin.createdAt || new Date().toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new admin (super admin only)
app.post("/admin/admins", authenticateAdmin, async (req, res) => {
  try {
    // Check if current admin is super admin (accessName: 'admin')
    if (req.admin.accessName !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only super admin can add new admins.' 
      });
    }

    const { accessName, password, adminKey, adminName } = req.body;

    // Validation
    if (!accessName || !password || !adminKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Access name, password, and admin key are required' 
      });
    }

    // Check if access name already exists
    const existingAdmin = await AdminModel.findOne({ accessName });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this access name already exists' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new AdminModel({
      accessName,
      password: hashedPassword,
      adminKey,
      adminName: adminName || accessName
    });

    await admin.save();

    res.status(201).json({ 
      success: true, 
      message: 'Admin added successfully',
      admin: {
        id: admin._id,
        accessName: admin.accessName,
        adminName: admin.adminName
      }
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update admin (super admin only)
app.put("/admin/admins/:id", authenticateAdmin, async (req, res) => {
  try {
    // Check if current admin is super admin (accessName: 'admin')
    if (req.admin.accessName !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only super admin can update admins.' 
      });
    }

    const { id } = req.params;
    const { accessName, password, adminKey, adminName } = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid admin ID format" });
    }

    // Find admin by ID
    const admin = await AdminModel.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Check if access name already exists (if changing access name)
    if (accessName && accessName !== admin.accessName) {
      const existingAdmin = await AdminModel.findOne({ accessName });
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false, 
          message: 'Admin with this access name already exists' 
        });
      }
    }

    // Update admin fields
    if (accessName) admin.accessName = accessName;
    if (adminKey) admin.adminKey = adminKey;
    if (adminName) admin.adminName = adminName;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }

    await admin.save();

    res.status(200).json({ 
      success: true, 
      message: 'Admin updated successfully',
      admin: {
        id: admin._id,
        accessName: admin.accessName,
        adminName: admin.adminName
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete admin (super admin only)
app.delete("/admin/admins/:id", authenticateAdmin, async (req, res) => {
  try {
    // Check if current admin is super admin (accessName: 'admin')
    if (req.admin.accessName !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only super admin can delete admins.' 
      });
    }

    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid admin ID format" });
    }

    // Check if trying to delete super admin
    const admin = await AdminModel.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (admin.accessName === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete super admin' 
      });
    }

    await AdminModel.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Category Management APIs

// Get all categories (admin only) with hierarchy
app.get("/admin/categories", authenticateAdmin, async (req, res) => {
  try {
    const categories = await CategoryModel.find({ isActive: true })
      .populate('createdBy', 'accessName adminName')
      .populate('parentId', 'name')
      .sort({ category: 1, parentId: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        category: cat.category,
        parentId: cat.parentId?._id || null,
        parentName: cat.parentId?.name || null,
        description: cat.description,
        createdBy: cat.createdBy?.adminName || cat.createdBy?.accessName || 'Unknown',
        createdAt: cat.createdAt
      }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get categories by type with hierarchy (for user pages)
app.get("/categories/:categoryType", async (req, res) => {
  try {
    const { categoryType } = req.params;
    
    // Validate category type
    if (!['warranty', 'subscription', 'homeTask'].includes(categoryType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category type. Must be warranty, subscription, or homeTask' 
      });
    }
    
    const categories = await CategoryModel.find({ 
      category: categoryType, 
      isActive: true 
    }).populate('parentId', 'name').sort({ parentId: 1, name: 1 });
    
    // Organize into parent-child structure
    const parents = categories.filter(cat => !cat.parentId);
    const children = categories.filter(cat => cat.parentId);
    
    const hierarchical = parents.map(parent => ({
      id: parent._id,
      name: parent.name,
      category: parent.category,
      description: parent.description,
      subcategories: children
        .filter(child => child.parentId._id.toString() === parent._id.toString())
        .map(child => ({
          id: child._id,
          name: child.name,
          category: child.category,
          parentId: child.parentId._id,
          parentName: child.parentId.name
        }))
    }));
    
    res.status(200).json({
      success: true,
      categories: hierarchical
    });
  } catch (error) {
    console.error('Get categories by type error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new category or subcategory (admin only)
app.post("/admin/categories", authenticateAdmin, async (req, res) => {
  try {
    const { name, category, parentId, description } = req.body;
    
    // Validation
    if (!name || !category || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, category, and description are required' 
      });
    }
    
    // Validate category type
    if (!['warranty', 'subscription', 'homeTask'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category. Must be warranty, subscription, or homeTask' 
      });
    }
    
    // If parentId is provided, validate it exists
    if (parentId) {
      const parentCategory = await CategoryModel.findOne({ 
        _id: parentId, 
        isActive: true,
        parentId: null // Parent must be a root category
      });
      
      if (!parentCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent category not found or is not a root category' 
        });
      }
      
      // Ensure parent is in the same category type
      if (parentCategory.category !== category) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent category must be in the same section' 
        });
      }
    }
    
    // Check if category already exists
    const existingCategory = await CategoryModel.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      category,
      parentId: parentId || null
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: parentId ? 
          'Subcategory with this name already exists under this parent' : 
          'Category with this name already exists in this section'
      });
    }
    
    const newCategory = new CategoryModel({
      name,
      category,
      parentId: parentId || null,
      description,
      createdBy: req.admin.id
    });
    
    await newCategory.save();
    
    res.status(201).json({
      success: true,
      message: parentId ? 'Subcategory created successfully' : 'Category created successfully',
      category: {
        id: newCategory._id,
        name: newCategory.name,
        category: newCategory.category,
        parentId: newCategory.parentId,
        description: newCategory.description
      }
    });
  } catch (error) {
    console.error('Add category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Category already exists with this combination' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Update category (admin only)
app.put("/admin/categories/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, parentId, description, isActive } = req.body;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID format" });
    }
    
    // Validate category type if provided
    if (category && !['warranty', 'subscription', 'homeTask'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category. Must be warranty, subscription, or homeTask' 
      });
    }
    
    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    
    // If changing parentId, validate it
    if (parentId !== undefined && parentId !== null) {
      const parentCategory = await CategoryModel.findOne({ 
        _id: parentId, 
        isActive: true,
        parentId: null
      });
      
      if (!parentCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent category not found or is not a root category' 
        });
      }
    }
    
    // Check if updated category already exists (excluding current one)
    if (name && category) {
      const duplicateCategory = await CategoryModel.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        category,
        parentId: parentId !== undefined ? parentId : existingCategory.parentId,
        _id: { $ne: id }
      });
      
      if (duplicateCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category with this name already exists in this section' 
        });
      }
    }
    
    // Update category fields
    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).populate('parentId', 'name');
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: updatedCategory._id,
        name: updatedCategory.name,
        category: updatedCategory.category,
        parentId: updatedCategory.parentId?._id || null,
        parentName: updatedCategory.parentId?.name || null,
        description: updatedCategory.description,
        isActive: updatedCategory.isActive
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Category already exists with this combination' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Get parent categories only (for parent dropdown in admin)
app.get("/admin/parent-categories/:categoryType", authenticateAdmin, async (req, res) => {
  try {
    const { categoryType } = req.params;
    
    // Validate category type
    if (!['warranty', 'subscription', 'homeTask'].includes(categoryType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category type' 
      });
    }
    
    const parentCategories = await CategoryModel.find({ 
      category: categoryType,
      parentId: null,  // Only root categories
      isActive: true 
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      categories: parentCategories.map(cat => ({
        id: cat._id,
        name: cat.name
      }))
    });
  } catch (error) {
    console.error('Get parent categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete category (admin only)
app.delete("/admin/categories/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID format" });
    }
    
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    
    // If it's a parent category, also soft delete its subcategories
    if (!category.parentId) {
      await CategoryModel.updateMany(
        { parentId: id },
        { isActive: false }
      );
    }
    
    // Soft delete by setting isActive to false instead of hard delete
    // This preserves data integrity for existing user items
    await CategoryModel.findByIdAndUpdate(id, { isActive: false });
    
    res.status(200).json({
      success: true,
      message: category.parentId ? 
        'Subcategory deleted successfully' : 
        'Category and its subcategories deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Service Provider APIs

// Get all service providers (admin only)
app.get("/admin/service-providers", authenticateAdmin, async (req, res) => {
  try {
    const serviceProviders = await ServiceProviderModel.find({})
      .sort({ category: 1, location: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      serviceProviders: serviceProviders.map(sp => ({
        id: sp._id,
        name: sp.name,
        category: sp.category,
        location: sp.location,
        contactName: sp.contactName,
        phone: sp.phone,
        email: sp.email,
        address: sp.address,
        description: sp.description,
        rating: sp.rating,
        isActive: sp.isActive,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get service providers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service providers filtered by category and location (for users)
app.get("/service-providers", authenticateToken, async (req, res) => {
  try {
    const { category, location } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (location) query.location = location;
    
    const serviceProviders = await ServiceProviderModel.find(query)
      .sort({ category: 1, location: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      serviceProviders: serviceProviders.map(sp => ({
        id: sp._id,
        name: sp.name,
        category: sp.category,
        location: sp.location,
        contactName: sp.contactName,
        phone: sp.phone,
        email: sp.email,
        address: sp.address,
        description: sp.description,
        rating: sp.rating
      }))
    });
  } catch (error) {
    console.error('Get service providers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add service provider (admin only)
app.post("/admin/service-providers", authenticateAdmin, async (req, res) => {
  try {
    const { name, category, location, contactName, phone, email, address, description, rating } = req.body;
    
    // Validation
    if (!name || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and location are required'
      });
    }
    
    const serviceProvider = new ServiceProviderModel({
      name,
      category,
      location,
      contactName: contactName || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      description: description || '',
      rating: rating || 0,
      createdBy: req.admin.id
    });
    
    await serviceProvider.save();
    
    res.status(201).json({
      success: true,
      message: 'Service provider added successfully',
      serviceProvider: {
        id: serviceProvider._id,
        name: serviceProvider.name,
        category: serviceProvider.category,
        location: serviceProvider.location,
        contactName: serviceProvider.contactName,
        phone: serviceProvider.phone,
        email: serviceProvider.email,
        address: serviceProvider.address,
        description: serviceProvider.description,
        rating: serviceProvider.rating,
        isActive: serviceProvider.isActive
      }
    });
  } catch (error) {
    console.error('Add service provider error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update service provider (admin only)
app.put("/admin/service-providers/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, contactName, phone, email, address, description, rating, isActive } = req.body;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service provider ID format" });
    }
    
    const serviceProvider = await ServiceProviderModel.findById(id);
    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: "Service provider not found" });
    }
    
    // Update fields
    if (name !== undefined) serviceProvider.name = name;
    if (category !== undefined) serviceProvider.category = category;
    if (location !== undefined) serviceProvider.location = location;
    if (contactName !== undefined) serviceProvider.contactName = contactName;
    if (phone !== undefined) serviceProvider.phone = phone;
    if (email !== undefined) serviceProvider.email = email;
    if (address !== undefined) serviceProvider.address = address;
    if (description !== undefined) serviceProvider.description = description;
    if (rating !== undefined) serviceProvider.rating = rating;
    if (isActive !== undefined) serviceProvider.isActive = isActive;
    
    await serviceProvider.save();
    
    res.status(200).json({
      success: true,
      message: 'Service provider updated successfully',
      serviceProvider: {
        id: serviceProvider._id,
        name: serviceProvider.name,
        category: serviceProvider.category,
        location: serviceProvider.location,
        contactName: serviceProvider.contactName,
        phone: serviceProvider.phone,
        email: serviceProvider.email,
        address: serviceProvider.address,
        description: serviceProvider.description,
        rating: serviceProvider.rating,
        isActive: serviceProvider.isActive
      }
    });
  } catch (error) {
    console.error('Update service provider error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete service provider (admin only)
app.delete("/admin/service-providers/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service provider ID format" });
    }
    
    const serviceProvider = await ServiceProviderModel.findById(id);
    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: "Service provider not found" });
    }
    
    // Soft delete by setting isActive to false
    await ServiceProviderModel.findByIdAndUpdate(id, { isActive: false });
    
    res.status(200).json({
      success: true,
      message: 'Service provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete service provider error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notification APIs

// Get user notifications
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications
    
    res.status(200).json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedItemId: notification.relatedItemId,
        relatedItemName: notification.relatedItemName,
        dueDate: notification.dueDate
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
app.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format" });
    }

    // Find and update notification
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
app.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
app.delete("/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format" });
    }

    const notification = await NotificationModel.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get notification count (unread)
app.get("/notifications/count", authenticateToken, async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      userId: req.user.userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin APIs for Reminder Logs

// Get all reminder logs (admin only)
app.get("/admin/reminder-logs", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, userId } = req.query;
    
    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;
    
    const logs = await ReminderLogModel.find(filter)
      .populate('userId', 'userName email')
      .sort({ dateSent: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReminderLogModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      logs: logs.map(log => ({
        id: log._id,
        userId: log.userId._id,
        userName: log.userId.userName,
        userEmail: log.userEmail,
        type: log.type,
        title: log.title,
        message: log.message,
        dateSent: log.dateSent,
        status: log.status,
        errorMessage: log.errorMessage,
        relatedItemId: log.relatedItemId,
        relatedItemName: log.relatedItemName
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get reminder logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reminder statistics (admin only)
app.get("/admin/reminder-stats", authenticateAdmin, async (req, res) => {
  try {
    const totalLogs = await ReminderLogModel.countDocuments();
    const sentLogs = await ReminderLogModel.countDocuments({ status: 'sent' });
    const failedLogs = await ReminderLogModel.countDocuments({ status: 'failed' });
    
    const warrantyLogs = await ReminderLogModel.countDocuments({ type: 'warranty' });
    const subscriptionLogs = await ReminderLogModel.countDocuments({ type: 'subscription' });
    const maintenanceLogs = await ReminderLogModel.countDocuments({ type: 'maintenance' });

    // Get logs from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await ReminderLogModel.countDocuments({
      dateSent: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalLogs,
        sent: sentLogs,
        failed: failedLogs,
        successRate: totalLogs > 0 ? ((sentLogs / totalLogs) * 100).toFixed(2) : 0,
        byType: {
          warranty: warrantyLogs,
          subscription: subscriptionLogs,
          maintenance: maintenanceLogs
        },
        recent: recentLogs
      }
    });
  } catch (error) {
    console.error('Get reminder stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get comprehensive admin statistics
app.get("/admin/statistics", authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get basic counts
    const totalUsers = await UsersModel.countDocuments();
    const activeUsers = await UsersModel.countDocuments({ status: 'active' });
    const inactiveUsers = await UsersModel.countDocuments({ status: 'inactive' });
    
    const totalWarranties = await WarrantyModel.countDocuments();
    const totalSubscriptions = await SubscriptionModel.countDocuments();
    const totalTasks = await HomeTaskModel.countDocuments();
    
    // Get counts with date filter
    const warrantiesInPeriod = await WarrantyModel.countDocuments(dateFilter);
    const subscriptionsInPeriod = await SubscriptionModel.countDocuments(dateFilter);
    const tasksInPeriod = await HomeTaskModel.countDocuments(dateFilter);
    const usersInPeriod = await UsersModel.countDocuments(dateFilter);

    // Get category distribution
    const warrantyCategories = await WarrantyModel.aggregate([
      { $group: { _id: "$warrantyCategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const subscriptionCategories = await SubscriptionModel.aggregate([
      { $group: { _id: "$subscriptionCategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const taskCategories = await HomeTaskModel.aggregate([
      { $group: { _id: "$homeTaskCategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get user growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await UsersModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Get task completion statistics
    const completedTasks = await HomeTaskModel.countDocuments({ homeTaskCompleted: true });
    const pendingTasks = await HomeTaskModel.countDocuments({ homeTaskCompleted: false });
    
    // Get task status distribution
    const taskStatusDistribution = await HomeTaskModel.aggregate([
      { $group: { _id: "$homeTaskStatus", count: { $sum: 1 } } }
    ]);

    // Get priority distribution
    const priorityDistribution = await HomeTaskModel.aggregate([
      { $group: { _id: "$homeTaskPriority", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          inPeriod: usersInPeriod
        },
        warranties: {
          total: totalWarranties,
          inPeriod: warrantiesInPeriod,
          categories: warrantyCategories
        },
        subscriptions: {
          total: totalSubscriptions,
          inPeriod: subscriptionsInPeriod,
          categories: subscriptionCategories
        },
        tasks: {
          total: totalTasks,
          inPeriod: tasksInPeriod,
          completed: completedTasks,
          pending: pendingTasks,
          statusDistribution: taskStatusDistribution,
          priorityDistribution: priorityDistribution,
          categories: taskCategories
        },
        userGrowth: userGrowth,
        period: {
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user activity logs
app.get("/admin/user-activity", authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get recent user activities (this is a simplified version - in a real app you'd have activity logs)
    const recentUsers = await UsersModel.find(dateFilter)
      .select('userName email createdAt status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get recent warranties created
    const recentWarranties = await WarrantyModel.find(dateFilter)
      .populate('userId', 'userName email')
      .select('warrantyName warrantyCategory createdAt userId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get recent subscriptions
    const recentSubscriptions = await SubscriptionModel.find(dateFilter)
      .populate('userId', 'userName email')
      .select('subscriptionName subscriptionCategory createdAt userId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get recent tasks
    const recentTasks = await HomeTaskModel.find(dateFilter)
      .populate('userId', 'userName email')
      .select('homeTaskName homeTaskCategory homeTaskStatus homeTaskCompleted createdAt userId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      activity: {
        users: recentUsers,
        warranties: recentWarranties,
        subscriptions: recentSubscriptions,
        tasks: recentTasks
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get system performance metrics (simplified - in real app you'd have monitoring)
app.get("/admin/system-metrics", authenticateAdmin, async (req, res) => {
  try {
    // Get database connection status
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get collection sizes
    const userCount = await UsersModel.countDocuments();
    const warrantyCount = await WarrantyModel.countDocuments();
    const subscriptionCount = await SubscriptionModel.countDocuments();
    const taskCount = await HomeTaskModel.countDocuments();
    const categoryCount = await CategoryModel.countDocuments();

    // Calculate approximate storage usage (simplified)
    const totalDocuments = userCount + warrantyCount + subscriptionCount + taskCount + categoryCount;
    const estimatedStorageMB = Math.round(totalDocuments * 0.001); // Rough estimate

    res.status(200).json({
      success: true,
      metrics: {
        database: {
          status: dbStates[dbState],
          collections: {
            users: userCount,
            warranties: warrantyCount,
            subscriptions: subscriptionCount,
            tasks: taskCount,
            categories: categoryCount
          },
          totalDocuments: totalDocuments,
          estimatedStorageMB: estimatedStorageMB
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get error logs (simplified - in real app you'd have proper error logging)
app.get("/admin/error-logs", authenticateAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // This is a simplified version - in a real application you'd have proper error logging
    // For now, we'll return some basic system information
    const errorLogs = [
      {
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        message: 'System running normally',
        module: 'System',
        userId: 'system'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'INFO',
        message: 'Database connection stable',
        module: 'Database',
        userId: 'system'
      }
    ];

    res.status(200).json({
      success: true,
      logs: errorLogs.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all warranties from all users (admin only)
app.get("/admin/all-warranties", authenticateAdmin, async (req, res) => {
  try {
    const warranties = await WarrantyModel.find({})
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      warranties
    });
  } catch (error) {
    console.error('Get all warranties error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all subscriptions from all users (admin only)
app.get("/admin/all-subscriptions", authenticateAdmin, async (req, res) => {
  try {
    const subscriptions = await SubscriptionModel.find({})
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all tasks from all users (admin only)
app.get("/admin/all-tasks", authenticateAdmin, async (req, res) => {
  try {
    const tasks = await HomeTaskModel.find({})
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete warranty (admin only - can delete any warranty)
app.delete("/admin/delete-warranty/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid warranty ID format" });
    }

    const warranty = await WarrantyModel.findById(id);
    if (!warranty) {
      return res.status(404).json({ success: false, message: "Warranty not found" });
    }

    await WarrantyModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Warranty deleted successfully' });
  } catch (error) {
    console.error('Admin delete warranty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete subscription (admin only - can delete any subscription)
app.delete("/admin/delete-subscription/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID format" });
    }

    const subscription = await SubscriptionModel.findById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    await SubscriptionModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Admin delete subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete task (admin only - can delete any task)
app.delete("/admin/delete-task/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID format" });
    }

    const task = await HomeTaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await HomeTaskModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Admin delete task error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Live Chat APIs

// Get or create live chat session for user
app.get("/livechat/session", authenticateToken, async (req, res) => {
  try {
    // Find existing active chat or create new one
    let chat = await LiveChatModel.findOne({
      userId: req.user.userId,
      status: { $in: ['pending', 'active'] }
    }).sort({ createdAt: -1 });

    if (!chat) {
      chat = new LiveChatModel({
        userId: req.user.userId,
        status: 'pending',
        messages: []
      });
      await chat.save();
    }

    // Return chatId and status, but NOT messages
    // Messages are preserved in DB for admin, but user starts fresh each session
    res.status(200).json({
      success: true,
      chatId: chat._id,
      messages: [], // Don't send messages to user - they start fresh
      status: chat.status,
      adminId: chat.adminId
    });
  } catch (error) {
    console.error('Get live chat session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get chat history for user
app.get("/livechat/history", authenticateToken, async (req, res) => {
  try {
    const chats = await LiveChatModel.find({
      userId: req.user.userId
    }).sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get live chat history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all pending/active chats
app.get("/admin/livechats", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    // Include all statuses including 'resolved' to show chat history
    const query = status ? { status } : {};
    
    const chats = await LiveChatModel.find(query)
      .populate('userId', 'userName email')
      .populate('adminId', 'accessName email')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get admin live chats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get specific chat
app.get("/admin/livechat/:chatId", authenticateAdmin, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await LiveChatModel.findById(chatId)
      .populate('userId', 'userName email')
      .populate('adminId', 'accessName email');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get admin chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Assign chat to admin
app.post("/admin/livechat/:chatId/assign", authenticateAdmin, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await LiveChatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.adminId = req.admin.id;
    chat.status = 'active';
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat assigned successfully',
      chat
    });
  } catch (error) {
    console.error('Assign chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Resolve/Close chat
app.post("/admin/livechat/:chatId/resolve", authenticateAdmin, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await LiveChatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.status = 'resolved';
    chat.resolvedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat resolved successfully',
      chat
    });
  } catch (error) {
    console.error('Resolve chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chatbot APIs

// Get or create chat session
// Chatbot session endpoint - returns chatId but not messages (user starts fresh)
app.get("/chat/session", authenticateToken, async (req, res) => {
  try {
    // Find active chat session for user
    let chat = await ChatModel.findOne({
      userId: req.user.userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    // If no active chat, create a new one
    if (!chat) {
      chat = new ChatModel({
        userId: req.user.userId,
        messages: [{
          role: 'system',
          content: 'Chat session started. How can I help you today?'
        }]
      });
      await chat.save();
    }

    // Get initial suggestions
    const suggestions = getSuggestions('initial');

    // Return chatId and suggestions, but NOT messages
    // Messages are preserved in DB, but user starts fresh each session
    res.status(200).json({
      success: true,
      chatId: chat._id,
      messages: [], // Don't send messages to user - they start fresh
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send message to chatbot
app.post("/chat/message", authenticateToken, async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    // Find or create chat session
    let chat = chatId 
      ? await ChatModel.findOne({ _id: chatId, userId: req.user.userId })
      : await ChatModel.findOne({ userId: req.user.userId, status: 'active' })
          .sort({ createdAt: -1 });

    if (!chat) {
      chat = new ChatModel({
        userId: req.user.userId,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message.trim()
    });

    // Get chatbot response
    const botResponse = getChatbotResponse(message, req.user.userId);

    // Add bot response
    chat.messages.push({
      role: 'assistant',
      content: botResponse.response
    });

    // Update chat status if escalated
    if (botResponse.shouldEscalate) {
      chat.escalated = true;
      chat.escalatedAt = new Date();
      chat.status = 'escalated';
    }

    await chat.save();

    // Get suggestions based on intent
    const suggestions = getSuggestions(botResponse.intent);

    res.status(200).json({
      success: true,
      chatId: chat._id,
      response: botResponse.response,
      intent: botResponse.intent,
      escalated: botResponse.shouldEscalate || false,
      suggestions: suggestions,
      messages: chat.messages
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get chat history
app.get("/chat/history", authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const chats = await ChatModel.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('_id status escalated createdAt updatedAt');

    res.status(200).json({
      success: true,
      chats: chats.map(chat => ({
        id: chat._id,
        status: chat.status,
        escalated: chat.escalated,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific chat by ID
app.get("/chat/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID format" });
    }

    const chat = await ChatModel.findOne({ 
      _id: id, 
      userId: req.user.userId 
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        messages: chat.messages,
        status: chat.status,
        escalated: chat.escalated,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Close/Resolve chat session
app.put("/chat/:id/close", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID format" });
    }

    const chat = await ChatModel.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { status: 'resolved' },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({
      success: true,
      message: "Chat session closed"
    });
  } catch (error) {
    console.error('Close chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Escalate chat to live support
app.post("/chat/:id/escalate", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID format" });
    }

    const chat = await ChatModel.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { 
        escalated: true,
        escalatedAt: new Date(),
        status: 'escalated',
        $push: {
          messages: {
            role: 'system',
            content: reason ? `Chat escalated: ${reason}` : 'Chat escalated to live support'
          }
        }
      },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({
      success: true,
      message: "Chat escalated to live support. A support agent will be with you shortly.",
      chatId: chat._id
    });
  } catch (error) {
    console.error('Escalate chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



