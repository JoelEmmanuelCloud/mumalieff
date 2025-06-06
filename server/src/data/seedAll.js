/**
 * Simple Master Seeder Script
 * Works with your existing user data
 * 
 * Usage: node data/seedAllSimple.js
 */
const { exec } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const runSeeder = (scriptName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`\n🌱 Running ${scriptName}...`);
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error in ${scriptName}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️  Warning in ${scriptName}:`, stderr);
      }
      
      console.log(`✅ ${scriptName} completed:`);
      console.log(stdout);
      resolve();
    });
  });
};

const seedAll = async () => {
  try {
    console.log('🚀 Starting database seeding process...');
    console.log('📝 Note: Using your existing users, will only seed products, reviews, and orders\n');
    
    // Run seeders in the correct order (skip user seeders since you have existing users)
    await runSeeder('seedProducts.js');
    await runSeeder('seedReviews.js');
    await runSeeder('seedOrders.js');
    
    console.log('\n🎉 All seeders completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Used existing users (including admin)');
    console.log('✅ Created sample products with categories');
    console.log('✅ Added product reviews from existing users');
    console.log('✅ Generated sample orders for existing users');
    console.log('\n🔑 Your Admin Credentials:');
    console.log('Email: admin@mumalieff.com');
    console.log('Password: admin123');
    console.log('\n🛍️ Sample user for testing:');
    console.log('Email: john@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('\n💥 Seeding process failed:', error.message);
    process.exit(1);
  }
};

seedAll();