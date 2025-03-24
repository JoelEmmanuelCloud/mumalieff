/**
 * Product Seeder Script
 * 
 * Usage: node data/seedProducts.js
 */
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const User = require('../models/userModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding products'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedProducts = async () => {
  try {
    // Get admin user ID (needed for product creation)
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      console.error('Admin user not found. Please run seedUsers.js first');
      process.exit(1);
    }
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Products cleared');

    // Sample products matching your schema exactly
    const sampleProducts = [
      {
        user: adminUser._id,
        name: 'Classic Black T-Shirt',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820821/mumalieff/black-tshirt-front_dkjqiz.jpg',
            publicId: 'mumalieff/black-tshirt-front_dkjqiz',
            alt: 'Black T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820822/mumalieff/black-tshirt-back_ghmzfk.jpg',
            publicId: 'mumalieff/black-tshirt-back_ghmzfk',
            alt: 'Black T-Shirt Back View'
          }
        ],
        category: 'Plain Tees',
        description: 'Essential black t-shirt made from premium cotton. Comfortable fit with reinforced stitching for durability.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true },
          { name: '2XL', inStock: true }
        ],
        colors: [
          { 
            name: 'Black', 
            colorCode: '#000000',
            inStock: true 
          }
        ],
        price: 24.99,
        countInStock: 50,
        material: '100% Premium Cotton',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      },
      {
        user: adminUser._id,
        name: 'White Essential T-Shirt',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820823/mumalieff/white-tshirt-front_rqhxn2.jpg',
            publicId: 'mumalieff/white-tshirt-front_rqhxn2',
            alt: 'White T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820824/mumalieff/white-tshirt-back_wdmn4p.jpg',
            publicId: 'mumalieff/white-tshirt-back_wdmn4p',
            alt: 'White T-Shirt Back View'
          }
        ],
        category: 'Plain Tees',
        description: 'Classic white t-shirt crafted from 100% organic cotton. Versatile and comfortable for any occasion.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true },
          { name: '2XL', inStock: true }
        ],
        colors: [
          { 
            name: 'White', 
            colorCode: '#FFFFFF',
            inStock: true 
          }
        ],
        price: 24.99,
        countInStock: 35,
        material: '100% Organic Cotton',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      },
      {
        user: adminUser._id,
        name: 'Geometric Pattern Tee',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820825/mumalieff/geometric-tshirt-front_zcw9fb.jpg',
            publicId: 'mumalieff/geometric-tshirt-front_zcw9fb',
            alt: 'Geometric Pattern T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820826/mumalieff/geometric-tshirt-back_bfklnm.jpg',
            publicId: 'mumalieff/geometric-tshirt-back_bfklnm',
            alt: 'Geometric Pattern T-Shirt Back View'
          }
        ],
        category: 'Graphic Tees',
        description: 'Bold geometric pattern t-shirt with modern design. Screen printed on premium cotton blend fabric.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true }
        ],
        colors: [
          { 
            name: 'Navy', 
            colorCode: '#000080',
            inStock: true 
          },
          { 
            name: 'Black', 
            colorCode: '#000000',
            inStock: true 
          }
        ],
        price: 34.99,
        countInStock: 25,
        material: '90% Cotton, 10% Polyester',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      },
      {
        user: adminUser._id,
        name: 'Urban Skyline Graphic Tee',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820827/mumalieff/skyline-tshirt-front_qhxmrd.jpg',
            publicId: 'mumalieff/skyline-tshirt-front_qhxmrd',
            alt: 'Urban Skyline T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820828/mumalieff/skyline-tshirt-back_ymngbr.jpg',
            publicId: 'mumalieff/skyline-tshirt-back_ymngbr',
            alt: 'Urban Skyline T-Shirt Back View'
          }
        ],
        category: 'Graphic Tees',
        description: 'Urban cityscape silhouette design printed on soft premium cotton. Perfect for city lovers.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true },
          { name: '2XL', inStock: true }
        ],
        colors: [
          { 
            name: 'White', 
            colorCode: '#FFFFFF',
            inStock: true 
          },
          { 
            name: 'Gray', 
            colorCode: '#808080',
            inStock: true 
          }
        ],
        price: 32.99,
        countInStock: 18,
        material: '100% Combed Ring-Spun Cotton',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: false
      },
      {
        user: adminUser._id,
        name: 'Vintage Logo T-Shirt',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820829/mumalieff/vintage-tshirt-front_dlmhtq.jpg',
            publicId: 'mumalieff/vintage-tshirt-front_dlmhtq',
            alt: 'Vintage Logo T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820830/mumalieff/vintage-tshirt-back_gxvbrc.jpg',
            publicId: 'mumalieff/vintage-tshirt-back_gxvbrc',
            alt: 'Vintage Logo T-Shirt Back View'
          }
        ],
        category: 'Graphic Tees',
        description: 'Retro-inspired logo t-shirt with distressed print effect. Soft vintage wash fabric for authentic feel.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true }
        ],
        colors: [
          { 
            name: 'Faded Red', 
            colorCode: '#C04040',
            inStock: true 
          },
          { 
            name: 'Washed Blue', 
            colorCode: '#6B8CAE',
            inStock: true 
          },
          { 
            name: 'Vintage Black', 
            colorCode: '#333333',
            inStock: true 
          }
        ],
        price: 29.99,
        countInStock: 22,
        material: 'Soft Vintage Wash Cotton',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: false,
        isSale: true,
        salePrice: 24.99
      },
      {
        user: adminUser._id,
        name: 'Abstract Art Print T-Shirt',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820831/mumalieff/abstract-tshirt-front_jwh3xm.jpg',
            publicId: 'mumalieff/abstract-tshirt-front_jwh3xm',
            alt: 'Abstract Art T-Shirt Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820832/mumalieff/abstract-tshirt-back_plkfvt.jpg',
            publicId: 'mumalieff/abstract-tshirt-back_plkfvt',
            alt: 'Abstract Art T-Shirt Back View'
          }
        ],
        category: 'Graphic Tees',
        description: 'Colorful abstract art design printed on premium white cotton. Each piece is a wearable masterpiece.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true }
        ],
        colors: [
          { 
            name: 'White', 
            colorCode: '#FFFFFF',
            inStock: true 
          }
        ],
        price: 39.99,
        countInStock: 15,
        material: 'Premium 180 GSM Cotton',
        allowCustomization: false,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      },
      {
        user: adminUser._id,
        name: 'Custom Name Sports Jersey',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820833/mumalieff/custom-jersey-front_kpvqbw.jpg',
            publicId: 'mumalieff/custom-jersey-front_kpvqbw',
            alt: 'Custom Sports Jersey Front View'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820834/mumalieff/custom-jersey-back_mklpse.jpg',
            publicId: 'mumalieff/custom-jersey-back_mklpse',
            alt: 'Custom Sports Jersey Back View'
          }
        ],
        category: 'Custom Prints',
        description: 'Personalized sports jersey with your name and number. High-quality performance fabric with moisture-wicking technology.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true },
          { name: '2XL', inStock: true }
        ],
        colors: [
          { 
            name: 'Red', 
            colorCode: '#FF0000',
            inStock: true 
          },
          { 
            name: 'Blue', 
            colorCode: '#0000FF',
            inStock: true 
          },
          { 
            name: 'Green', 
            colorCode: '#008000',
            inStock: true 
          },
          { 
            name: 'Black', 
            colorCode: '#000000',
            inStock: true 
          }
        ],
        price: 49.99,
        countInStock: 100,
        material: 'Performance Polyester Mesh',
        allowCustomization: true,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      },
      {
        user: adminUser._id,
        name: 'Photo Memory T-Shirt',
        images: [
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820835/mumalieff/photo-tshirt-example1_fphgjt.jpg',
            publicId: 'mumalieff/photo-tshirt-example1_fphgjt',
            alt: 'Photo T-Shirt Example 1'
          },
          {
            url: 'https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820836/mumalieff/photo-tshirt-example2_qtdknc.jpg',
            publicId: 'mumalieff/photo-tshirt-example2_qtdknc',
            alt: 'Photo T-Shirt Example 2'
          }
        ],
        category: 'Custom Prints',
        description: 'Personalized t-shirt with your photo printed using advanced digital techniques. Perfect for gifts or special occasions.',
        sizes: [
          { name: 'S', inStock: true },
          { name: 'M', inStock: true },
          { name: 'L', inStock: true },
          { name: 'XL', inStock: true },
          { name: '2XL', inStock: true }
        ],
        colors: [
          { 
            name: 'White', 
            colorCode: '#FFFFFF',
            inStock: true 
          },
          { 
            name: 'Black', 
            colorCode: '#000000',
            inStock: true 
          },
          { 
            name: 'Gray', 
            colorCode: '#808080',
            inStock: true 
          }
        ],
        price: 44.99,
        countInStock: 100,
        material: '100% Premium Cotton',
        allowCustomization: true,
        reviews: [],
        rating: 0,
        numReviews: 0,
        featured: true
      }
    ];

    // Insert products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`${createdProducts.length} products inserted`);

    console.log('Sample products seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error seeding products: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();