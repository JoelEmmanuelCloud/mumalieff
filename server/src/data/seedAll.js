/**
 * Master Seed Script - Populates the database with mock data
 * 
 * Usage: node data/seedAll.js
 * This will run all seed scripts in the correct order
 */
const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

console.log('Starting database seeding process...');

const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`Running ${scriptName}...`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptName}: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`${scriptName} stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve();
    });
  });
};

const seedDatabase = async () => {
  try {
    // Run seed scripts in order
    await runScript('seedUsers.js');
    console.log('✓ Users seeded successfully\n');
    
    // Add a delay to ensure users are properly saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runScript('seedProducts.js');
    console.log('✓ Products seeded successfully\n');
    
    await runScript('seedReviews.js');
    console.log('✓ Reviews seeded successfully\n');
    
    await runScript('seedOrders.js');
    console.log('✓ Orders seeded successfully\n');
    
    console.log('='.repeat(50));
    console.log('🎉 Database seeding completed successfully! 🎉');
    console.log('='.repeat(50));
    console.log('\nAdmin login credentials:');
    console.log('Email: admin@mumalieff.com');
    console.log('Password: admin123');
    console.log('\nRegular user credentials:');
    console.log('Email: john@example.com');
    console.log('Password: password123');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
};

seedDatabase();