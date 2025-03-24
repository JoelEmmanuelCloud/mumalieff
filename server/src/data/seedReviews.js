/**
 * Review Seeder Script
 * 
 * Usage: node data/seedReviews.js
 * Note: Run this AFTER seeding users and products
 */
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const User = require('../models/userModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding reviews'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample review comments
const reviewComments = [
  {
    rating: 5,
    comments: [
      "Absolutely love this t-shirt! The fabric is soft and comfortable, and the fit is perfect.",
      "Great quality product. The material feels premium and the design is exactly as pictured.",
      "I've purchased several t-shirts from this brand and they never disappoint. This one is my favorite so far!",
      "Perfect fit and super comfortable. Will definitely be ordering more in different colors.",
      "The quality exceeds what I expected for the price. Very satisfied with my purchase.",
      "This shirt has become my go-to for casual wear. Love the feel and the design.",
      "The color is vibrant and hasn't faded after several washes. Excellent quality!"
    ]
  },
  {
    rating: 4,
    comments: [
      "Really nice t-shirt. Good quality fabric and nice fit. Lost one star because the color was slightly different than pictured.",
      "Very comfortable and good quality. Fits as expected but slightly shorter than I would prefer.",
      "Great t-shirt overall. The material is good quality but takes a bit longer to dry after washing.",
      "Nice design and comfortable fit. Would have given 5 stars but it shrunk a little after the first wash.",
      "Good value for money and quick delivery. Just a bit looser than I expected."
    ]
  },
  {
    rating: 3,
    comments: [
      "Decent t-shirt for the price. Nothing special but does the job.",
      "Average quality. The fabric is thinner than I expected but the design is nice.",
      "It's okay. Fit is good but the material could be better.",
      "The design is exactly as shown but the fabric isn't as soft as described."
    ]
  },
  {
    rating: 2,
    comments: [
      "Disappointed with the quality. The stitching started coming apart after just a few wears.",
      "The sizing runs much smaller than indicated. Had to return for a larger size.",
      "Not worth the price. The fabric is too thin and feels cheap."
    ]
  },
  {
    rating: 1,
    comments: [
      "Poor quality product. The color faded significantly after first wash despite following care instructions.",
      "Very disappointed. The shirt arrived with a small tear near the seam.",
      "Complete waste of money. The fit was nothing like described and the material feels scratchy."
    ]
  }
];

const seedReviews = async () => {
  try {
    // Get users and products from the database
    const users = await User.find({ isAdmin: false }).limit(10);
    const products = await Product.find({});
    
    if (users.length === 0 || products.length === 0) {
      console.error('Please seed users and products first');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} users and ${products.length} products`);
    
    // Create reviews for each product
    for (const product of products) {
      // Clear existing reviews
      product.reviews = [];
      
      // Random number of reviews per product (3-8)
      const numReviews = Math.floor(Math.random() * 6) + 3;
      let totalRating = 0;
      
      // Shuffle users to get random reviewers
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numReviews && i < shuffledUsers.length; i++) {
        const user = shuffledUsers[i];
        
        // Random rating weighted towards 4-5 stars (more positive reviews)
        const ratingWeights = [0.05, 0.1, 0.15, 0.3, 0.4]; // Weights for 1-5 stars
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
        const ratingComments = reviewComments.find(r => r.rating === rating).comments;
        const comment = ratingComments[Math.floor(Math.random() * ratingComments.length)];
        
        // Random dates in the past 90 days
        const daysAgo = Math.floor(Math.random() * 90) + 1;
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - daysAgo);
        
        // Add review to product
        product.reviews.push({
          user: user._id,
          name: user.name,
          rating,
          comment,
          createdAt: reviewDate
        });
        
        totalRating += rating;
      }
      
      // Update product with review stats
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      
      // Save the updated product
      await product.save();
      console.log(`Added ${product.reviews.length} reviews to product: ${product.name}`);
    }
    
    console.log('Reviews seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error seeding reviews: ${error.message}`);
    process.exit(1);
  }
};

seedReviews();