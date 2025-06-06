/**
 * Simple Orders Seeder Script
 * Works with your existing users and products
 * 
 * Usage: node data/seedOrdersSimple.js
 */
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding orders'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedOrders = async () => {
  try {
    // Get users and products from the database
    const users = await User.find({ isAdmin: false }).limit(10);
    const products = await Product.find({}).limit(8);
    
    if (users.length === 0 || products.length === 0) {
      console.error('❌ Please ensure you have users and products in the database first');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users and ${products.length} products`);
    
    // Clear existing orders
    const deletedCount = await Order.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing orders`);
    
    // Prepare sample orders
    const sampleOrders = [];
    
    // Order statuses
    const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    // Nigerian cities and states for shipping
    const nigerianLocations = [
      { city: 'Lagos', state: 'Lagos', postalCode: '101233' },
      { city: 'Abuja', state: 'FCT', postalCode: '900288' },
      { city: 'Port Harcourt', state: 'Rivers', postalCode: '500272' },
      { city: 'Kano', state: 'Kano', postalCode: '700241' },
      { city: 'Ibadan', state: 'Oyo', postalCode: '200223' },
      { city: 'Kaduna', state: 'Kaduna', postalCode: '800283' },
      { city: 'Enugu', state: 'Enugu', postalCode: '400281' },
      { city: 'Onitsha', state: 'Anambra', postalCode: '420001' }
    ];
    
    let totalOrdersCreated = 0;
    
    // Create orders for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Random number of orders per user (1-3)
      const numOrders = Math.floor(Math.random() * 3) + 1;
      
      console.log(`\n📦 Creating orders for: ${user.name}`);
      
      for (let j = 0; j < numOrders; j++) {
        // Random number of items per order (1-3)
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let itemsPrice = 0;
        
        // Add random products to order
        const selectedProducts = [];
        for (let k = 0; k < numItems; k++) {
          let randomProduct;
          // Ensure no duplicate products in the same order
          do {
            randomProduct = products[Math.floor(Math.random() * products.length)];
          } while (selectedProducts.includes(randomProduct._id.toString()));
          
          selectedProducts.push(randomProduct._id.toString());
          
          const qty = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          
          // Select a random size and color
          const size = randomProduct.sizes[Math.floor(Math.random() * randomProduct.sizes.length)].name;
          const color = randomProduct.colors[Math.floor(Math.random() * randomProduct.colors.length)].name;
          
          // Calculate price (convert from kobo to naira for display, but store in kobo)
          const productPrice = randomProduct.isSale && randomProduct.salePrice ? 
            randomProduct.salePrice : randomProduct.price;
          
          // Create custom design for some customizable products
          let customDesign = { hasCustomDesign: false };
          
          if (randomProduct.allowCustomization && Math.random() > 0.6) {
            customDesign = {
              hasCustomDesign: true,
              designUrl: `https://example.com/custom-design-${Math.floor(Math.random() * 100)}.png`,
              designPublicId: `custom-design-${Math.floor(Math.random() * 100)}`,
              designPlacement: ['front', 'back', 'left-sleeve', 'right-sleeve'][Math.floor(Math.random() * 4)],
              designSize: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
            };
          }
          
          orderItems.push({
            name: randomProduct.name,
            qty,
            image: randomProduct.images[0].url,
            price: productPrice,
            size,
            color,
            product: randomProduct._id,
            customDesign
          });
          
          itemsPrice += productPrice * qty;
        }
        
        if (orderItems.length === 0) continue;
        
        // Calculate prices (prices are in kobo, so convert appropriately)
        const shippingPrice = itemsPrice > 10000 ? 0 : 1000; // Free shipping over ₦100
        const taxPrice = Math.round(0.075 * itemsPrice); // 7.5% VAT
        const totalPrice = itemsPrice + shippingPrice + taxPrice;
        
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
          const location = nigerianLocations[Math.floor(Math.random() * nigerianLocations.length)];
          shippingAddress = {
            address: `${Math.floor(Math.random() * 999) + 1} ${['Main Street', 'Victoria Street', 'Allen Avenue', 'Broad Street', 'Market Road'][Math.floor(Math.random() * 5)]}`,
            city: location.city,
            state: location.state,
            postalCode: location.postalCode,
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
        
        const discount = promoCode ? Math.round(itemsPrice * 0.1) : 0; // 10% discount if promo code exists
        const finalTotalPrice = totalPrice - discount;
        
        sampleOrders.push({
          user: user._id,
          orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice: finalTotalPrice,
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
        
        totalOrdersCreated++;
        
        console.log(`   📦 Order ${j + 1}: ${orderItems.length} items, ₦${(finalTotalPrice / 100).toFixed(2)}, ${status}`);
      }
    }
    
    // Insert orders
    console.log(`\n💾 Saving ${sampleOrders.length} orders to database...`);
    const createdOrders = await Order.insertMany(sampleOrders);
    
    console.log(`🎉 Successfully created ${createdOrders.length} orders!`);
    
    // Summary statistics
    const statusCounts = {};
    const paymentMethodCounts = {};
    let totalRevenue = 0;
    
    createdOrders.forEach(order => {
      // Count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Count payment methods
      paymentMethodCounts[order.paymentMethod] = (paymentMethodCounts[order.paymentMethod] || 0) + 1;
      
      // Calculate revenue (only from paid orders)
      if (order.isPaid) {
        totalRevenue += order.totalPrice;
      }
    });
    
    console.log('\n📊 Order Summary:');
    console.log(`   Total orders: ${createdOrders.length}`);
    console.log(`   Total revenue: ₦${(totalRevenue / 100).toFixed(2)}`);
    console.log(`   Paid orders: ${createdOrders.filter(o => o.isPaid).length}`);
    console.log(`   Unpaid orders: ${createdOrders.filter(o => !o.isPaid).length}`);
    
    console.log('\n📈 Order Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });
    
    console.log('\n💳 Payment Method Breakdown:');
    Object.entries(paymentMethodCounts).forEach(([method, count]) => {
      console.log(`   ${method}: ${count} orders`);
    });
    
    mongoose.connection.close();
    console.log('\n✅ Orders seeding completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error seeding orders: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedOrders();