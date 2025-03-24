/**
 * Order Seeder Script
 * 
 * Usage: node data/seedOrders.js
 * Note: Run this AFTER seeding users and products
 */
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding orders'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedOrders = async () => {
  try {
    // Get users and products from the database
    const users = await User.find({ isAdmin: false }).limit(10);
    const products = await Product.find({}).limit(8);
    
    if (users.length === 0 || products.length === 0) {
      console.error('Please seed users and products first');
      process.exit(1);
    }
    
    // Clear existing orders
    await Order.deleteMany({});
    console.log('Orders cleared');
    
    // Prepare sample orders
    const sampleOrders = [];
    
    // Order statuses
    const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    // Create orders for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Random number of orders per user (1-3)
      const numOrders = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numOrders; j++) {
        // Random number of items per order (1-4)
        const numItems = Math.floor(Math.random() * 4) + 1;
        const orderItems = [];
        let itemsPrice = 0;
        
        // Add random products to order
        for (let k = 0; k < numItems; k++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 3) + 1;
          
          // Select a random size from product's available sizes
          const sizeObj = randomProduct.sizes[Math.floor(Math.random() * randomProduct.sizes.length)];
          const size = sizeObj.name;
          
          // Select a random color from product's available colors
          const colorObj = randomProduct.colors[Math.floor(Math.random() * randomProduct.colors.length)];
          const color = colorObj.name;
          
          // Only add product if not already in order
          if (!orderItems.some(item => item.product.toString() === randomProduct._id.toString())) {
            // Create custom design for some products
            let customDesign = {
              hasCustomDesign: false
            };
            
            if (randomProduct.allowCustomization && Math.random() > 0.5) {
              customDesign = {
                hasCustomDesign: true,
                designUrl: `https://res.cloudinary.com/dzoqgkizq/image/upload/v1647820840/mumalieff/custom-design-${Math.floor(Math.random() * 5) + 1}_lmknvs.png`,
                designPublicId: `mumalieff/custom-design-${Math.floor(Math.random() * 5) + 1}_lmknvs`,
                designPlacement: ['front', 'back', 'left-sleeve', 'right-sleeve'][Math.floor(Math.random() * 4)],
                designSize: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
              };
            }
            
            orderItems.push({
              name: randomProduct.name,
              qty,
              image: randomProduct.images[0].url,
              price: randomProduct.isSale ? randomProduct.salePrice : randomProduct.price,
              size,
              color,
              product: randomProduct._id,
              customDesign
            });
            
            itemsPrice += (randomProduct.isSale ? randomProduct.salePrice : randomProduct.price) * qty;
          }
        }
        
        if (orderItems.length === 0) continue;
        
        // Calculate prices
        const shippingPrice = itemsPrice > 100 ? 0 : 10;
        const taxPrice = Number((0.075 * itemsPrice).toFixed(2)); // 7.5% VAT
        const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);
        
        // Random dates in the past 60 days
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);
        
        // Create order status
        const isPaid = Math.random() > 0.2; // 80% chance to be paid
        const paidAt = isPaid ? new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined;
        
        // Select random status
        let status = 'Pending';
        if (isPaid) {
          const randomStatusIndex = Math.floor(Math.random() * 4); // Only select from first 4 statuses for paid orders
          status = orderStatuses[randomStatusIndex];
        }
        
        const isDelivered = status === 'Delivered';
        const deliveredAt = isDelivered ? new Date(paidAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : undefined;
        
        // Create shipping address (use user's address if available or create random one)
        let shippingAddress;
        if (user.shippingAddresses && user.shippingAddresses.length > 0) {
          const address = user.shippingAddresses[0];
          shippingAddress = {
            address: address.address,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country || 'Nigeria'
          };
        } else {
          shippingAddress = {
            address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
            city: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'][Math.floor(Math.random() * 5)],
            state: ['Lagos', 'FCT', 'Rivers', 'Kano', 'Oyo'][Math.floor(Math.random() * 5)],
            postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            country: 'Nigeria'
          };
        }
        
        // Create payment method
        const paymentMethod = ['paystack-card', 'paystack-transfer'][Math.floor(Math.random() * 2)];
        
        // Payment result for paid orders
        const paymentResult = isPaid ? {
          id: `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: 'success',
          update_time: paidAt.toISOString(),
          email_address: user.email,
          reference: `REF-${Math.random().toString(36).substring(2, 15).toUpperCase()}`
        } : undefined;
        
        // Tracking number for shipped or delivered orders
        const trackingNumber = (status === 'Shipped' || status === 'Delivered') ? 
          `TRK${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}NG` : undefined;
        
        // Random notes and promo codes
        const notes = Math.random() > 0.7 ? [
          'Please deliver to the security post',
          'Call before delivery',
          'Please include gift wrapping',
          'This is a gift, please remove price tags'
        ][Math.floor(Math.random() * 4)] : undefined;
        
        const promoCode = Math.random() > 0.8 ? [
          'WELCOME10',
          'SUMMER20',
          'NEWCUSTOMER',
          'DISCOUNT5'
        ][Math.floor(Math.random() * 4)] : undefined;
        
        const discount = promoCode ? Number((itemsPrice * 0.1).toFixed(2)) : 0; // 10% discount if promo code exists
        
        sampleOrders.push({
          user: user._id,
          orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          isPaid,
          paidAt,
          status,
          trackingNumber,
          isDelivered,
          deliveredAt,
          paymentResult,
          notes,
          promoCode,
          discount,
          createdAt: orderDate,
        });
      }
    }
    
    // Insert orders
    await Order.insertMany(sampleOrders);
    console.log(`${sampleOrders.length} orders inserted successfully!`);
    
    process.exit();
  } catch (error) {
    console.error(`Error seeding orders: ${error.message}`);
    process.exit(1);
  }
};

seedOrders();