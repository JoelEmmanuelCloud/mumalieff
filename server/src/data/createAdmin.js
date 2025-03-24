/**
 * createAdmin.js - Secure script for creating admin users
 * 
 * Usage: 
 * node createAdmin.js
 */
const mongoose = require('mongoose');
const User = require('../models/userModel');
const crypto = require('crypto');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for admin creation'))
  .catch(err => console.error('MongoDB connection error:', err));

const createAdminUser = async () => {
  try {
    // Default admin info - you can modify these values directly in the script
    const adminEmail = 'admin@mumalieff.com';
    const adminName = 'Admin User';
    
    // Check if admin with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      if (existingUser.isAdmin) {
        console.log(`Admin user already exists with email: ${adminEmail}`);
        console.log(`Name: ${existingUser.name}`);
        console.log(`ID: ${existingUser._id}`);
        process.exit(0);
      } else {
        console.log(`A non-admin user exists with email: ${adminEmail}. Please modify the email in the script.`);
        process.exit(1);
      }
    }
    
    // Generate a secure random password (better than hardcoded)
    const generatedPassword = crypto.randomBytes(6).toString('hex');
    
    // Create the user object (let the model handle password hashing)
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: generatedPassword, // Will be hashed by pre-save hook
      isAdmin: true,
      requirePasswordChange: true // Force password change on first login
    });
    
    // Save the user
    await adminUser.save();
    
    console.log('='.repeat(50));
    console.log('ADMIN USER CREATED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`ID: ${adminUser._id}`);
    console.log(`Initial Password: ${generatedPassword}`);
    console.log('\nWARNING: Store this password securely. It will not be shown again.');
    console.log('The admin will be required to change this password on first login.');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();