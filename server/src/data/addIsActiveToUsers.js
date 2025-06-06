const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Migration Script: Add isActive field to existing users
 * This script adds the isActive field with default value true to all existing users
 * who don't already have this field.
 */

const runMigration = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('')
    console.log('✅ Connected to MongoDB successfully');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('🔄 Starting migration: Adding isActive field to users...');

    // Check how many users need the migration
    const usersNeedingMigration = await usersCollection.countDocuments({
      isActive: { $exists: false }
    });

    console.log(`📊 Found ${usersNeedingMigration} users that need the isActive field`);

    if (usersNeedingMigration === 0) {
      console.log('✅ No users need migration. All users already have isActive field.');
      return;
    }

    // Perform the migration
    const result = await usersCollection.updateMany(
      { isActive: { $exists: false } },
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date() // Update the updatedAt timestamp
        } 
      }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Modified ${result.modifiedCount} user documents`);
    console.log(`📊 Matched ${result.matchedCount} user documents`);

    // Verify the migration
    const verificationCount = await usersCollection.countDocuments({
      isActive: { $exists: false }
    });

    if (verificationCount === 0) {
      console.log('✅ Verification passed: All users now have isActive field');
    } else {
      console.log(`⚠️  Warning: ${verificationCount} users still missing isActive field`);
    }

    // Show summary of user statuses
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
    const totalUsers = await usersCollection.countDocuments({});

    console.log('\n📈 User Status Summary:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Active Users: ${activeUsers}`);
    console.log(`   Inactive Users: ${inactiveUsers}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting User Migration Script...');
  console.log('📝 This script will add isActive field to existing users');
  console.log('⏱️  Starting in 3 seconds...\n');
  
  setTimeout(() => {
    runMigration();
  }, 3000);
}

module.exports = runMigration;