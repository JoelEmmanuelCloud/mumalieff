/**
 * Simple Product Seeder Script
 * Works with your existing users - Updated for new category structure
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

    // Sample products with new category structure
    const sampleProducts = [
      // WEAR YOUR CONVICTION CATEGORY
      {
        user: adminUser._id,
        name: 'Faith Over Fear T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            alt: 'Faith Over Fear T-Shirt Front View',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Religious/Spiritual',
        description: 'Inspiring faith-based design printed on premium cotton. A powerful reminder to choose faith over fear in every situation.',
        convictionMessage: 'When fear knocks at your door, let faith answer. This design represents the courage to trust in something greater than our circumstances.',
        designInspiration: 'Inspired by countless stories of people who overcame challenges through faith and determination.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 20 },
          { name: 'M', inStock: true, stockCount: 25 },
          { name: 'L', inStock: true, stockCount: 30 },
          { name: 'XL', inStock: true, stockCount: 15 },
          { name: '2XL', inStock: true, stockCount: 10 }
        ],
        colors: [
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 50 },
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 50 }
        ],
        price: 3499, // Store in kobo/cents
        countInStock: 100,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['faith', 'inspiration', 'motivational']
      },
      {
        user: adminUser._id,
        name: 'Blessed & Grateful Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500',
            alt: 'Blessed & Grateful T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Religious/Spiritual',
        description: 'Beautiful typography design celebrating gratitude and blessings. Perfect for daily inspiration and positive vibes.',
        convictionMessage: 'Gratitude transforms what we have into enough. Wear this reminder that every day brings new blessings to appreciate.',
        designInspiration: 'Created to remind us that gratitude is not only the greatest virtue but the parent of all others.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 15 },
          { name: 'M', inStock: true, stockCount: 20 },
          { name: 'L', inStock: true, stockCount: 25 },
          { name: 'XL', inStock: true, stockCount: 10 },
          { name: '2XL', inStock: true, stockCount: 5 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 35 },
          { name: 'Soft Pink', colorCode: '#FFB6C1', inStock: true, stockCount: 40 }
        ],
        price: 3299,
        countInStock: 75,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['blessed', 'grateful', 'positive']
      },
      {
        user: adminUser._id,
        name: 'Dream Big Achieve More',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
            alt: 'Dream Big Achieve More T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Motivational',
        description: 'Motivational design with bold typography encouraging big dreams and achievements. For the ambitious and determined.',
        convictionMessage: 'Your dreams are valid, no matter where you come from. This design celebrates the courage to dream beyond your circumstances.',
        designInspiration: 'Inspired by dreamers and achievers who dared to think bigger than their current reality.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 8 },
          { name: 'M', inStock: true, stockCount: 12 },
          { name: 'L', inStock: true, stockCount: 15 },
          { name: 'XL', inStock: true, stockCount: 10 }
        ],
        colors: [
          { name: 'Navy', colorCode: '#000080', inStock: true, stockCount: 15 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 10 },
          { name: 'Royal Blue', colorCode: '#4169E1', inStock: true, stockCount: 20 }
        ],
        price: 3699,
        countInStock: 45,
        material: 'Cotton Blend',
        allowCustomization: false,
        featured: true,
        tags: ['dreams', 'motivation', 'success']
      },
      {
        user: adminUser._id,
        name: 'Love Wins Always',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
            alt: 'Love Wins Always T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Motivational',
        description: 'Powerful message of love and unity. Elegant design that spreads positivity and promotes love over hate.',
        convictionMessage: 'In a world that can feel divided, love remains our strongest weapon. Choose love, spread love, be love.',
        designInspiration: 'Created in response to the need for more unity and understanding in our communities.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 5 },
          { name: 'M', inStock: true, stockCount: 8 },
          { name: 'L', inStock: true, stockCount: 10 },
          { name: 'XL', inStock: true, stockCount: 7 },
          { name: '2XL', inStock: true, stockCount: 3 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 12 },
          { name: 'Light Gray', colorCode: '#D3D3D3', inStock: true, stockCount: 10 },
          { name: 'Red', colorCode: '#DC143C', inStock: true, stockCount: 11 }
        ],
        price: 3399,
        countInStock: 33,
        material: 'Cotton',
        allowCustomization: false,
        featured: false,
        tags: ['love', 'unity', 'peace']
      },
      {
        user: adminUser._id,
        name: 'Be the Change Quote Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500',
            alt: 'Be the Change Quote T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Motivational',
        description: 'Iconic Gandhi quote inspiring personal transformation and social change. Vintage-style print on premium fabric.',
        convictionMessage: 'Be the change you wish to see in the world. Start with yourself, inspire others, transform communities.',
        designInspiration: 'Timeless wisdom from Mahatma Gandhi, reminding us that change begins with individual action.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 6 },
          { name: 'M', inStock: true, stockCount: 8 },
          { name: 'L', inStock: true, stockCount: 10 },
          { name: 'XL', inStock: true, stockCount: 5 }
        ],
        colors: [
          { name: 'Vintage Green', colorCode: '#355E3B', inStock: true, stockCount: 8 },
          { name: 'Mustard Yellow', colorCode: '#FFDB58', inStock: true, stockCount: 7 },
          { name: 'Rust Orange', colorCode: '#CD853F', inStock: true, stockCount: 7 }
        ],
        price: 3199,
        salePrice: 2699,
        countInStock: 22,
        material: 'Cotton',
        allowCustomization: false,
        featured: false,
        isSale: true,
        tags: ['gandhi', 'change', 'inspiration', 'vintage']
      },
      {
        user: adminUser._id,
        name: 'Purpose Driven Life Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500',
            alt: 'Purpose Driven Life T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Wear Your Conviction',
        designStyle: 'Religious/Spiritual',
        description: 'Elegant design celebrating living with purpose and intention. Perfect for those who live with meaning and direction.',
        convictionMessage: 'Life is not about finding yourself, it\'s about creating yourself with purpose. Live intentionally, love deeply.',
        designInspiration: 'Designed for those who understand that true fulfillment comes from living aligned with your purpose.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 4 },
          { name: 'M', inStock: true, stockCount: 6 },
          { name: 'L', inStock: true, stockCount: 8 },
          { name: 'XL', inStock: true, stockCount: 4 }
        ],
        colors: [
          { name: 'Deep Purple', colorCode: '#483D8B', inStock: true, stockCount: 15 },
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 7 }
        ],
        price: 3599,
        countInStock: 22,
        material: 'Cotton',
        allowCustomization: false,
        featured: true,
        tags: ['purpose', 'meaning', 'life', 'intention']
      },

      // CUSTOMIZE YOUR PRINTS CATEGORY
      {
        user: adminUser._id,
        name: 'Custom Photo Print T-Shirt',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
            alt: 'Custom Photo Print T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Upload your favorite photo and we\'ll print it with high-quality digital printing. Perfect for personal memories, gifts, or unique designs.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 25 },
          { name: 'M', inStock: true, stockCount: 30 },
          { name: 'L', inStock: true, stockCount: 35 },
          { name: 'XL', inStock: true, stockCount: 25 },
          { name: '2XL', inStock: true, stockCount: 15 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 50 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 40 },
          { name: 'Gray', colorCode: '#808080', inStock: true, stockCount: 40 }
        ],
        price: 4499,
        countInStock: 130,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: true,
          maxTextLength: 50,
          customizationPrice: 1500
        },
        featured: true,
        tags: ['photo', 'custom', 'personalized', 'gift']
      },
      {
        user: adminUser._id,
        name: 'Your Text Here Custom Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500',
            alt: 'Custom Text T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Create your own message! Add any text, quote, or saying. Choose from multiple fonts and colors for truly personalized apparel.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 30 },
          { name: 'M', inStock: true, stockCount: 35 },
          { name: 'L', inStock: true, stockCount: 40 },
          { name: 'XL', inStock: true, stockCount: 30 },
          { name: '2XL', inStock: true, stockCount: 20 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 50 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 50 },
          { name: 'Navy', colorCode: '#000080', inStock: true, stockCount: 25 },
          { name: 'Red', colorCode: '#FF0000', inStock: true, stockCount: 25 },
          { name: 'Royal Blue', colorCode: '#4169E1', inStock: true, stockCount: 25 }
        ],
        price: 3999,
        countInStock: 175,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: false,
          maxTextLength: 100,
          customizationPrice: 1000
        },
        featured: true,
        tags: ['text', 'custom', 'personalized', 'message']
      },
      {
        user: adminUser._id,
        name: 'Custom Logo/Brand Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500',
            alt: 'Custom Logo T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Perfect for businesses, events, or personal branding. Upload your logo or design and we\'ll print it professionally on premium fabric.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 20 },
          { name: 'M', inStock: true, stockCount: 25 },
          { name: 'L', inStock: true, stockCount: 30 },
          { name: 'XL', inStock: true, stockCount: 20 },
          { name: '2XL', inStock: true, stockCount: 15 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 40 },
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 40 },
          { name: 'Navy', colorCode: '#000080', inStock: true, stockCount: 30 }
        ],
        price: 4999,
        countInStock: 110,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: true,
          maxTextLength: 30,
          customizationPrice: 2000
        },
        featured: true,
        tags: ['logo', 'brand', 'business', 'custom']
      },
      {
        user: adminUser._id,
        name: 'Family Photo Collage Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1607083681542-bee5bb2c3ad9?w=500',
            alt: 'Family Photo Collage T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Create a beautiful collage with multiple family photos. Perfect for family reunions, special occasions, or as a meaningful gift.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 15 },
          { name: 'M', inStock: true, stockCount: 20 },
          { name: 'L', inStock: true, stockCount: 25 },
          { name: 'XL', inStock: true, stockCount: 15 },
          { name: '2XL', inStock: true, stockCount: 10 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 60 },
          { name: 'Light Gray', colorCode: '#D3D3D3', inStock: true, stockCount: 25 }
        ],
        price: 5499,
        countInStock: 85,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: true,
          maxTextLength: 40,
          customizationPrice: 2500
        },
        featured: false,
        tags: ['family', 'collage', 'photos', 'gift']
      },
      {
        user: adminUser._id,
        name: 'Custom Sports Jersey',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?w=500',
            alt: 'Custom Sports Jersey',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Design your own sports jersey with custom name, number, and colors. Perfect for teams, events, or personal use.',
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
          { name: 'Black', colorCode: '#000000', inStock: true, stockCount: 25 },
          { name: 'Yellow', colorCode: '#FFFF00', inStock: true, stockCount: 10 }
        ],
        price: 5999,
        countInStock: 110,
        material: 'Polyester',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: false,
          maxTextLength: 20,
          customizationPrice: 1500
        },
        featured: true,
        tags: ['sports', 'jersey', 'team', 'custom']
      },
      {
        user: adminUser._id,
        name: 'Anniversary/Wedding Custom Tee',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
            alt: 'Anniversary Wedding Custom T-Shirt',
            isPrimary: true
          }
        ],
        category: 'Customize Your Prints',
        description: 'Celebrate special moments with custom anniversary or wedding t-shirts. Add dates, names, photos, and special messages.',
        sizes: [
          { name: 'S', inStock: true, stockCount: 18 },
          { name: 'M', inStock: true, stockCount: 22 },
          { name: 'L', inStock: true, stockCount: 25 },
          { name: 'XL', inStock: true, stockCount: 18 },
          { name: '2XL', inStock: true, stockCount: 12 }
        ],
        colors: [
          { name: 'White', colorCode: '#FFFFFF', inStock: true, stockCount: 40 },
          { name: 'Blush Pink', colorCode: '#FFC0CB', inStock: true, stockCount: 35 },
          { name: 'Light Blue', colorCode: '#ADD8E6', inStock: true, stockCount: 20 }
        ],
        price: 4799,
        salePrice: 3999,
        countInStock: 95,
        material: 'Cotton',
        allowCustomization: true,
        customizationOptions: {
          allowText: true,
          allowImages: true,
          maxTextLength: 60,
          customizationPrice: 1800
        },
        featured: false,
        isSale: true,
        tags: ['anniversary', 'wedding', 'couples', 'celebration']
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