/**
 * Simple Product Seeder Script
 * Works with your existing users
 * 
 * Usage: node data/seedProductsSimple.js
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
  .then(() => console.log('MongoDB connected for seeding products'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedProducts = async () => {
  try {
    // Use your existing admin user
    const adminUser = await User.findOne({ email: 'admin@mumalieff.com' });
    
    if (!adminUser) {
      console.error('Admin user not found. Please check your database.');
      process.exit(1);
    }
    
    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
    
    // Clear existing products
    const deletedCount = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing products`);

    // Sample products with proper enum values
    const sampleProducts = [
      {
        user: adminUser._id,
        name: 'Classic Black T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            alt: 'Black T-Shirt Front View',
            isPrimary: true
          }
        ],
        category: 'Plain Tees',
        description: 'Essential black t-shirt made from premium cotton. Comfortable fit with reinforced stitching for durability.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 20 },
          { name: 'M', inStock: true, stockCount: 25 },
          { name: 'L', inStock: true, stockCount: 30 },
          { name: 'XL', inStock: true, stockCount: 15 },
          { name: '2XL', inStock: true, stockCount: 10 }
        ],
        colors: [
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 50 }
        ],
        price: 2499, // Store in kobo/cents
        countInStock: 50,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['basic', 'essential', 'cotton']
      },
      {
        user: adminUser._id,
        name: 'White Essential T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500',
            alt: 'White T-Shirt Front View',
            isPrimary: true
          }
        ],
        category: 'Plain Tees',
        description: 'Classic white t-shirt crafted from 100% organic cotton. Versatile and comfortable for any occasion.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 15 },
          { name: 'M', inStock: true, stockCount: 20 },
          { name: 'L', inStock: true, stockCount: 25 },
          { name: 'XL', inStock: true, stockCount: 10 },
          { name: '2XL', inStock: true, stockCount: 5 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 35 }
        ],
        price: 2499,
        countInStock: 35,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['basic', 'white', 'organic']
      },
      {
        user: adminUser._id,
        name: 'Geometric Pattern Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
            alt: 'Geometric Pattern T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Graphic Tees',
        description: 'Bold geometric pattern t-shirt with modern design. Screen printed on premium cotton blend fabric.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 8 },
          { name: 'M', inStock: true, stockCount: 12 },
          { name: 'L', inStock: true, stockCount: 15 },
          { name: 'XL', inStock: true, stockCount: 10 }
        ],
        colors: [
          { name: 'Navy', colorCode: '#000080', inStock: true, stockCount: 15 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 10 }
        ],
        price: 3499,
        countInStock: 25,
        material: 'Cotton Blend',
        allowCustomization: false,
        featured: true,
        tags: ['geometric', 'modern', 'pattern']
      },
      {
        user: adminUser._id,
        name: 'Urban Skyline Graphic Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
            alt: 'Urban Skyline T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Graphic Tees',
        description: 'Urban cityscape silhouette design printed on soft premium cotton. Perfect for city lovers.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 5 },
          { name: 'M', inStock: true, stockCount: 8 },
          { name: 'L', inStock: true, stockCount: 10 },
          { name: 'XL', inStock: true, stockCount: 7 },
          { name: '2XL', inStock: true, stockCount: 3 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 12 },
          { name: 'Gray', colorCode: '#808080', inStock: true, stockCount: 6 }
        ],
        price: 3299,
        countInStock: 18,
        material: 'Cotton',
        allowCustomization: false,
        featured: false,
        tags: ['urban', 'city', 'skyline']
      },
      {
        user: adminUser._id,
        name: 'Vintage Logo T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500',
            alt: 'Vintage Logo T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Graphic Tees',
        description: 'Retro-inspired logo t-shirt with distressed print effect. Soft vintage wash fabric for authentic feel.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 6 },
          { name: 'M', inStock: true, stockCount: 8 },
          { name: 'L', inStock: true, stockCount: 10 },
          { name: 'XL', inStock: true, stockCount: 5 }
        ],
        colors: [
          { name: 'Faded Red', colorCode: '#C04040', inStock: true, stockCount: 8 },
          { name: 'Washed Blue', colorCode: '#6B8CAE', inStock: true, stockCount: 7 },
          { name: 'Vintage Black', colorCode: '#333333', inStock: true, stockCount: 7 }
        ],
        price: 2999,
        salePrice: 2499,
        countInStock: 22,
        material: 'Cotton',
        allowCustomization: false,
        featured: false,
        isSale: true,
        tags: ['vintage', 'retro', 'distressed']
      },
      {
        user: adminUser._id,
        name: 'Custom Name Sports Jersey',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
            alt: 'Custom Sports Jersey',
            isPrimary: true
          }
        ],
        category: 'Custom Prints',
        description: 'Personalized sports jersey with your name and number. High-quality performance fabric with moisture-wicking technology.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 20 },
          { name: 'M', inStock: true, stockCount: 25 },
          { name: 'L', inStock: true, stockCount: 30 },
          { name: 'XL', inStock: true, stockCount: 20 },
          { name: '2XL', inStock: true, stockCount: 15 }
        ],
        colors: [
          { name: 'Red', colorCode: '#FF0000', inStock: true, stockCount: 25 },
          { name: 'Blue', colorCode: '#0000FF', inStock: true, stockCount: 25 },
          { name: 'Green', colorCode: '#008000', inStock: true, stockCount: 25 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 25 }
        ],
        price: 4999,
        countInStock: 100,
        material: 'Polyester',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: false,
          maxTextLength: 20,
          customizationPrice: 1000
        },
        featured: true,
        tags: ['sports', 'custom', 'jersey', 'personalized']
      },
      {
        user: adminUser._id,
        name: 'Photo Memory T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500',
            alt: 'Photo Memory T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Custom Prints',
        description: 'Personalized t-shirt with your photo printed using advanced digital techniques. Perfect for gifts or special occasions.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 25 },
          { name: 'M', inStock: true, stockCount: 30 },
          { name: 'L', inStock: true, stockCount: 35 },
          { name: 'XL', inStock: true, stockCount: 25 },
          { name: '2XL', inStock: true, stockCount: 15 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 50 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 25 },
          { name: 'Gray', colorCode: '#808080', inStock: true, stockCount: 25 }
        ],
        price: 4499,
        countInStock: 100,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: true,
          maxTextLength: 50,
          customizationPrice: 1500
        },
        featured: true,
        tags: ['photo', 'memory', 'custom', 'gift']
      },
      {
        user: adminUser._id,
        name: 'Abstract Art Print T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500',
            alt: 'Abstract Art T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Graphic Tees',
        description: 'Colorful abstract art design printed on premium white cotton. Each piece is a wearable masterpiece.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 4 },
          { name: 'M', inStock: true, stockCount: 6 },
          { name: 'L', inStock: true, stockCount: 8 },
          { name: 'XL', inStock: true, stockCount: 4 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 15 }
        ],
        price: 3999,
        countInStock: 15,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['abstract', 'art', 'colorful', 'unique']
      }
    ];

    // Insert products one by one to see individual results
    const createdProducts = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      try {
        const product = await Product.create(sampleProducts[i]);
        createdProducts.push(product);
        console.log(`✅ Created: ${product.name} (${product.category})`);
      } catch (error) {
        console.error(`❌ Failed to create ${sampleProducts[i].name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdProducts.length} products!`);
    console.log('\n📊 Product Summary:');
    
    // Group by category
    const categories = {};
    createdProducts.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = 0;
      }
      categories[product.category]++;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    console.log('\n🏷️  Featured products:', createdProducts.filter(p => p.featured).length);
    console.log('🏷️  Sale products:', createdProducts.filter(p => p.isSale).length);
    console.log('🎨 Customizable products:', createdProducts.filter(p => p.allowCustomization).length);
    
    mongoose.connection.close();
    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error seeding products: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedProducts();