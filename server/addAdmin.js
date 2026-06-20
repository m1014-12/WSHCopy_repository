import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import AdminModel from './Models/Admin.js';

mongoose.connect("mongodb+srv://Admin:admin@cluster0.26ccgyu.mongodb.net/WSH_group?retryWrites=true&w=majority&appName=Cluster0");

const run = async () => {
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  const admin = new AdminModel({
    accessName: 'admin',
    password: hashedPassword,
    adminKey: 'secretkey123'
  });
  // const admin = new AdminModel({ 
  //   accessName: 'admin',
  //   password: 'admin1234',
  //   adminKey: 'secretkey123'
  // });

  await admin.save();
  console.log("Admin created!");
  process.exit();
};

run();
