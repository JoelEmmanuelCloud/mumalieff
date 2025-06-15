/**
 * Simple Reviews Seeder Script
 * Works with your existing users and products - Updated for new categories
 * 
 * Usage: node data/seedReviewsSimple.js
 */
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding reviews'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample review comments by rating - updated for new categories
const reviewComments = {
  5: [
    // General positive reviews
    "Absolutely love this t-shirt! The fabric is soft and comfortable, and the fit is perfect.",
    "Great quality product. The material feels premium and the design is exactly as pictured.",
    "I've purchased several t-shirts from this brand and they never disappoint. This one is my favorite so far!",
    "Perfect fit and super comfortable. Will definitely be ordering more in different colors.",
    "The quality exceeds what I expected for the price. Very satisfied with my purchase.",
    "This shirt has become my go-to for casual wear. Love the feel and the design.",
    "The color is vibrant and hasn't faded after several washes. Excellent quality!",
    
    // Category-specific reviews
    "The inspirational message on this shirt really speaks to me. Love wearing my convictions!",
    "Amazing custom work! The photo print came out perfectly clear and vibrant.",
    "The customization process was so easy and the final result exceeded my expectations.",
    "This motivational design gives me confidence every time I wear it.",
    "Perfect for spreading positive vibes. I get compliments every time I wear this!",
    "The custom text looks exactly like I imagined. Professional quality printing.",
    "Love how this shirt represents my values. Great conversation starter too!"
  ],
  4: [
    "Really nice t-shirt. Good quality fabric and nice fit. Lost one star because the color was slightly different than pictured.",
    "Very comfortable and good quality. Fits as expected but slightly shorter than I would prefer.",
    "Great t-shirt overall. The material is good quality but takes a bit longer to dry after washing.",
    "Nice design and comfortable fit. Would have given 5 stars but it shrunk a little after the first wash.",
    "Good value for money and quick delivery. Just a bit looser than I expected.",
    "The custom design turned out well, but the delivery took longer than expected.",
    "Love the message and quality, but wish there were more color options available.",
    "Great for the price point. The inspirational quote is beautifully designed."
  ],
  3: [
    "Decent t-shirt for the price. Nothing special but does the job.",
    "Average quality. The fabric is thinner than I expected but the design is nice.",
    "It's okay. Fit is good but the material could be better.",
    "The design is exactly as shown but the fabric isn't as soft as described.",
    "Custom print quality is acceptable but not outstanding.",
    "The motivational message is nice but the print could be bolder."
  ],
  2: [
    "Disappointed with the quality. The stitching started coming apart after just a few wears.",
    "The sizing runs much smaller than indicated. Had to return for a larger size.",
    "Not worth the price. The fabric is too thin and feels cheap.",
    "Custom design didn't turn out as clear as I hoped.",
    "The print quality on the custom text wasn't as sharp as expected."
  ],
  1: [
    "Poor quality product. The color faded significantly after first wash despite following care instructions.",
    "Very disappointed. The shirt arrived with a small tear near the seam.",
    "Complete waste of money. The fit was nothing like described and the material feels scratchy.",
    "Custom print was blurry and off-center. Very disappointed with the customization quality.",
    "The inspirational design is barely visible after one wash. Poor print quality."
  ]
};

const seedReviews = async () => {
  try {
    // Get non-admin users and products
    const users = await User.find({ isAdmin: false }).limit(12);
    const products = await Product.find({});
    
    if (users.length === 0) {
      console.error('❌ No non-admin users found. Please check your database.');
      process.exit(1);
    }
    
    if (products.length === 0) {
      console.error('❌ No products found. Please run the product seeder first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users and ${products.length} products`);
    
    let totalReviewsAdded = 0;
    
    // Create reviews for each product
    for (const product of products) {
      // Clear existing reviews
      product.reviews = [];
      
      // More reviews for featured and customizable products
      let numReviews;
      if (product.featured && product.allowCustomization) {
        numReviews = Math.floor(Math.random() * 6) + 4; // 4-9 reviews
      } else if (product.featured || product.allowCustomization) {
        numReviews = Math.floor(Math.random() * 5) + 3; // 3-7 reviews
      } else {
        numReviews = Math.floor(Math.random() * 4) + 2; // 2-5 reviews
      }
      
      let totalRating = 0;
      
      // Shuffle users to get random reviewers
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      
      console.log(`\n📝 Adding reviews for: ${product.name} (${product.category})`);
      
      for (let i = 0; i < numReviews && i < shuffledUsers.length; i++) {
        const user = shuffledUsers[i];
        
        // Rating weights based on product category and features
        let ratingWeights;
        
        if (product.category === 'Wear Your Conviction') {
          // Inspirational products tend to get higher ratings
          ratingWeights = [0.02, 0.05, 0.08, 0.35, 0.5]; // More 4-5 star reviews
        } else if (product.category === 'Customize Your Prints') {
          // Custom products can be hit or miss
          ratingWeights = [0.05, 0.08, 0.12, 0.35, 0.4]; // Slightly more varied
        } else {
          // Default distribution
          ratingWeights = [0.05, 0.1, 0.15, 0.3, 0.4];
        }
        
        const randomValue = Math.random();
        let rating = 5; // Default if none of the thresholds match
        
        let cumulativeWeight = 0;
        for (let j = 0; j < ratingWeights.length; j++) {
          cumulativeWeight += ratingWeights[j];
          if (randomValue <= cumulativeWeight) {
            rating = j + 1;
            break;
          }
        }
        
        // Get a random comment based on the rating
        const ratingCommentsArray = reviewComments[rating];
        const comment = ratingCommentsArray[Math.floor(Math.random() * ratingCommentsArray.length)];
        
        // Random dates in the past 120 days (4 months)
        const daysAgo = Math.floor(Math.random() * 120) + 1;
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - daysAgo);
        
        // Higher chance of verified purchase for higher ratings
        const verifiedChance = rating >= 4 ? 0.8 : 0.6;
        
        // Add review to product
        product.reviews.push({
          user: user._id,
          name: user.name,
          rating,
          comment,
          verified: Math.random() < verifiedChance,
          createdAt: reviewDate
        });
        
        totalRating += rating;
        console.log(`   ⭐ ${rating}/5 by ${user.name}: "${comment.substring(0, 60)}..."`);
      }
      
      // Calculate and update product rating
      if (product.reviews.length > 0) {
        product.rating = Math.round((totalRating / product.reviews.length) * 10) / 10;
        product.numReviews = product.reviews.length;
      } else {
        product.rating = 0;
        product.numReviews = 0;
      }
      
      // Save the updated product
      await product.save();
      totalReviewsAdded += product.reviews.length;
      
      console.log(`   ✅ Added ${product.reviews.length} reviews (avg rating: ${product.rating})`);
    }
    
    console.log(`\n🎉 Successfully added ${totalReviewsAdded} reviews across ${products.length} products!`);
    
    // Summary statistics by category
    const categoryStats = {};
    
    products.forEach(product => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          count: 0,
          totalReviews: 0,
          totalRating: 0,
          avgRating: 0
        };
      }
      
      categoryStats[product.category].count++;
      categoryStats[product.category].totalReviews += product.numReviews;
      categoryStats[product.category].totalRating += product.rating * product.numReviews;
    });
    
    // Calculate average ratings per category
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      if (stats.totalReviews > 0) {
        stats.avgRating = Math.round((stats.totalRating / stats.totalReviews) * 10) / 10;
      }
    });
    
    // Overall statistics
    const avgRatings = products.map(p => p.rating).filter(r => r > 0);
    const overallAvg = avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length;
    
    console.log('\n📊 Review Summary:');
    console.log(`   Total reviews: ${totalReviewsAdded}`);
    console.log(`   Products with reviews: ${avgRatings.length}`);
    console.log(`   Overall average rating: ${Math.round(overallAvg * 10) / 10}/5`);
    console.log(`   Highest rated: ${Math.max(...avgRatings)}/5`);
    console.log(`   Lowest rated: ${Math.min(...avgRatings)}/5`);
    
    console.log('\n📈 Category Breakdown:');
    Object.entries(categoryStats).forEach(([category, stats]) => {
      console.log(`   ${category}:`);
      console.log(`     Products: ${stats.count}`);
      console.log(`     Reviews: ${stats.totalReviews}`);
      console.log(`     Avg Rating: ${stats.avgRating}/5`);
    });
    
    // Feature-based stats
    const featuredProducts = products.filter(p => p.featured);
    const customizableProducts = products.filter(p => p.allowCustomization);
    const saleProducts = products.filter(p => p.isSale);
    
    console.log('\n🏷️  Feature-based Stats:');
    console.log(`   Featured products: ${featuredProducts.length} (avg rating: ${featuredProducts.length > 0 ? Math.round((featuredProducts.reduce((sum, p) => sum + p.rating, 0) / featuredProducts.length) * 10) / 10 : 0}/5)`);
    console.log(`   Customizable products: ${customizableProducts.length} (avg rating: ${customizableProducts.length > 0 ? Math.round((customizableProducts.reduce((sum, p) => sum + p.rating, 0) / customizableProducts.length) * 10) / 10 : 0}/5)`);
    console.log(`   Sale products: ${saleProducts.length} (avg rating: ${saleProducts.length > 0 ? Math.round((saleProducts.reduce((sum, p) => sum + p.rating, 0) / saleProducts.length) * 10) / 10 : 0}/5)`);
    
    mongoose.connection.close();
    console.log('\n✅ Reviews seeding completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error seeding reviews: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedReviews();