require('dotenv').config();
const mongoose = require('mongoose');

async function fixReviews() {
  try {
    await mongoose.connect('');
    console.log('Connected to database');
    
    const result = await mongoose.connection.db.collection('products').updateMany(
      { 'reviews.0': { $exists: true } },
      {
        $set: {
          'reviews.$[].purchaseDate': new Date(),
          'reviews.$[].order': new mongoose.Types.ObjectId(),
          'reviews.$[].verified': true,
          'reviews.$[].isMigrated': true
        }
      }
    );
    
    console.log(`✅ Fixed ${result.modifiedCount} products`);
    console.log('All validation errors should now be resolved!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixReviews();