/**
 * Regular Orders Seeder Script - Updated for New Categories
 * Creates standard product orders (not custom design orders)
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
  .then(() => console.log('MongoDB connected for seeding regular orders'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedOrders = async () => {
  try {
    // Get users and products from the database
    const users = await User.find({ isAdmin: false }).limit(12);
    const products = await Product.find({ isActive: true });
    
    if (users.length === 0 || products.length === 0) {
      console.error('❌ Please ensure you have users and products in the database first');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users and ${products.length} products`);
    
    // Separate products by category for better order simulation
    const convictionProducts = products.filter(p => p.category === 'Wear Your Conviction');
    const customProducts = products.filter(p => p.category === 'Customize Your Prints');
    
    console.log(`   • ${convictionProducts.length} Conviction products`);
    console.log(`   • ${customProducts.length} Custom products`);
    
    // Clear existing regular orders
    const deletedCount = await Order.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing regular orders`);
    
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
      { city: 'Onitsha', state: 'Anambra', postalCode: '420001' },
      { city: 'Benin City', state: 'Edo', postalCode: '300001' },
      { city: 'Jos', state: 'Plateau', postalCode: '930001' }
    ];
    
    let totalOrdersCreated = 0;
    
    // Create orders for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Random number of orders per user (1-3, weighted towards fewer orders)
      const orderWeights = [0.5, 0.3, 0.2]; // 50% chance of 1 order, 30% of 2, 20% of 3
      const randomValue = Math.random();
      let numOrders = 1;
      
      let cumulativeWeight = 0;
      for (let j = 0; j < orderWeights.length; j++) {
        cumulativeWeight += orderWeights[j];
        if (randomValue <= cumulativeWeight) {
          numOrders = j + 1;
          break;
        }
      }
      
      console.log(`\n📦 Creating ${numOrders} order(s) for: ${user.name}`);
      
      for (let j = 0; j < numOrders; j++) {
        // Random number of items per order (1-3)
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let itemsPrice = 0;
        
        // Add random products to order
        const selectedProducts = [];
        for (let k = 0; k < numItems; k++) {
          let randomProduct;
          
          // 70% chance to pick from conviction products (they're more popular for regular orders)
          // 30% chance for custom products (but without customization - just base product)
          const useConvictionProduct = Math.random() < 0.7;
          const productPool = useConvictionProduct && convictionProducts.length > 0 
            ? convictionProducts 
            : customProducts.length > 0 
              ? customProducts 
              : products;
          
          // Ensure no duplicate products in the same order
          do {
            randomProduct = productPool[Math.floor(Math.random() * productPool.length)];
          } while (selectedProducts.includes(randomProduct._id.toString()) && productPool.length > selectedProducts.length);
          
          selectedProducts.push(randomProduct._id.toString());
          
          const qty = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          
          // Select a random size and color
          const size = randomProduct.sizes[Math.floor(Math.random() * randomProduct.sizes.length)].name;
          const color = randomProduct.colors[Math.floor(Math.random() * randomProduct.colors.length)].name;
          
          // Calculate price (use sale price if available)
          const productPrice = randomProduct.isSale && randomProduct.salePrice ? 
            randomProduct.salePrice : randomProduct.price;
          
          // For regular orders, we'll mostly NOT use custom designs
          // Only 10% chance of basic customization for custom products
          let customDesign = { hasCustomDesign: false };
          
          if (randomProduct.allowCustomization && randomProduct.category === 'Customize Your Prints' && Math.random() < 0.1) {
            const customTexts = [
              'My Name',
              'Lagos Warriors',
              'Class of 2024',
              'Team Spirit',
              'Custom Style'
            ];
            
            customDesign = {
              hasCustomDesign: true,
              designUrl: `https://example.com/simple-design-${Math.floor(Math.random() * 100)}.png`,
              designPublicId: `simple-design-${Math.floor(Math.random() * 100)}`,
              designPlacement: ['front', 'back'][Math.floor(Math.random() * 2)],
              designSize: ['medium', 'large'][Math.floor(Math.random() * 2)],
              customText: customTexts[Math.floor(Math.random() * customTexts.length)]
            };
            
            // Add basic customization fee (less than full custom orders)
            itemsPrice += 500 * qty; // Simple customization fee
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
        
        // Calculate prices (prices are in kobo)
        const shippingPrice = itemsPrice > 15000 ? 0 : 1500; // Free shipping over ₦150
        const taxPrice = Math.round(0.075 * itemsPrice); // 7.5% VAT
        const totalPrice = itemsPrice + shippingPrice + taxPrice;
        
        // Random dates in the past 90 days
        const daysAgo = Math.floor(Math.random() * 90) + 1;
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);
        
        // Create order status (higher success rate for regular orders)
        const isPaid = Math.random() > 0.1; // 90% chance to be paid
        const paidAt = isPaid ? new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined;
        
        // Select random status (regular orders process faster)
        let status = 'Pending';
        if (isPaid) {
          const statusWeights = [0.1, 0.2, 0.3, 0.35, 0.05]; // Pending, Processing, Shipped, Delivered, Cancelled
          const randomValue = Math.random();
          let cumulativeWeight = 0;
          
          for (let s = 0; s < statusWeights.length; s++) {
            cumulativeWeight += statusWeights[s];
            if (randomValue <= cumulativeWeight) {
              status = orderStatuses[s];
              break;
            }
          }
        }
        
        const isDelivered = status === 'Delivered';
        const deliveredAt = isDelivered ? new Date(paidAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined;
        
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
            address: `${Math.floor(Math.random() * 999) + 1} ${['Main Street', 'Victoria Street', 'Allen Avenue', 'Broad Street', 'Market Road', 'Independence Way', 'Ahmadu Bello Way', 'Ring Road'][Math.floor(Math.random() * 8)]}`,
            city: location.city,
            state: location.state,
            postalCode: location.postalCode,
            country: 'Nigeria'
          };
        }
        
        // Create payment method
        const paymentMethod = ['paystack-card', 'paystack-transfer', 'paystack-ussd'][Math.floor(Math.random() * 3)];
        
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
          `MLF${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}NG` : undefined;
        
        // Random notes and promo codes
        const notes = Math.random() > 0.75 ? [
          'Please deliver to the security post',
          'Call before delivery - I work from home',
          'Please include gift wrapping',
          'This is a gift, please remove price tags',
          'Handle with care',
          'Rush delivery if possible'
        ][Math.floor(Math.random() * 6)] : undefined;
        
        const promoCodes = ['WELCOME10', 'FAITH20', 'NEWCUSTOMER', 'INSPIRATION5', 'MUMALI15'];
        const promoCode = Math.random() > 0.85 ? 
          promoCodes[Math.floor(Math.random() * promoCodes.length)] : undefined;
        
        let discount = 0;
        if (promoCode) {
          if (promoCode.includes('20')) discount = Math.round(itemsPrice * 0.2);
          else if (promoCode.includes('15')) discount = Math.round(itemsPrice * 0.15);
          else if (promoCode.includes('10')) discount = Math.round(itemsPrice * 0.1);
          else discount = Math.round(itemsPrice * 0.05);
        }
        
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
        
        const hasBasicCustom = orderItems.some(item => item.customDesign.hasCustomDesign);
        const categoryBreakdown = orderItems.map(item => {
          const product = products.find(p => p._id.toString() === item.product.toString());
          return product ? product.category.substring(0, 10) : 'Unknown';
        }).join(', ');
        
        console.log(`   📦 Order ${j + 1}: ${orderItems.length} items [${categoryBreakdown}]${hasBasicCustom ? ' (basic custom)' : ''}, ₦${(finalTotalPrice / 100).toFixed(2)}, ${status}`);
      }
    }
    
    // Insert orders
    console.log(`\n💾 Saving ${sampleOrders.length} regular orders to database...`);
    const createdOrders = await Order.insertMany(sampleOrders);
    
    console.log(`🎉 Successfully created ${createdOrders.length} regular orders!`);
    
    // Summary statistics
    const statusCounts = {};
    const paymentMethodCounts = {};
    const categoryCounts = {
      'Wear Your Conviction': 0,
      'Customize Your Prints': 0
    };
    let totalRevenue = 0;
    let basicCustomOrdersCount = 0;
    let totalBasicCustomRevenue = 0;
    
    createdOrders.forEach(order => {
      // Count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Count payment methods
      paymentMethodCounts[order.paymentMethod] = (paymentMethodCounts[order.paymentMethod] || 0) + 1;
      
      // Calculate revenue (only from paid orders)
      if (order.isPaid) {
        totalRevenue += order.totalPrice;
      }
      
      // Count orders with basic custom designs
      const hasBasicCustomItems = order.orderItems.some(item => item.customDesign.hasCustomDesign);
      if (hasBasicCustomItems) {
        basicCustomOrdersCount++;
        if (order.isPaid) {
          totalBasicCustomRevenue += order.totalPrice;
        }
      }
      
      // Count by category (need to match with products)
      order.orderItems.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          categoryCounts[product.category]++;
        }
      });
    });
    
    console.log('\n📊 Regular Orders Summary:');
    console.log(`   Total orders: ${createdOrders.length}`);
    console.log(`   Total revenue: ₦${(totalRevenue / 100).toFixed(2)}`);
    console.log(`   Paid orders: ${createdOrders.filter(o => o.isPaid).length}`);
    console.log(`   Unpaid orders: ${createdOrders.filter(o => !o.isPaid).length}`);
    console.log(`   Orders with basic customization: ${basicCustomOrdersCount}`);
    console.log(`   Basic custom revenue: ₦${(totalBasicCustomRevenue / 100).toFixed(2)}`);
    
    console.log('\n📈 Order Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });
    
    console.log('\n💳 Payment Method Breakdown:');
    Object.entries(paymentMethodCounts).forEach(([method, count]) => {
      console.log(`   ${method}: ${count} orders`);
    });
    
    console.log('\n📦 Product Category Items Ordered:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} items`);
    });
    
    // Calculate average order values
    const paidOrders = createdOrders.filter(o => o.isPaid);
    const avgOrderValue = paidOrders.length > 0 ? 
      (totalRevenue / paidOrders.length / 100).toFixed(2) : 0;
    
    const basicCustomPaidOrders = createdOrders.filter(o => o.isPaid && o.orderItems.some(item => item.customDesign.hasCustomDesign));
    const avgBasicCustomOrderValue = basicCustomPaidOrders.length > 0 ? 
      (totalBasicCustomRevenue / basicCustomPaidOrders.length / 100).toFixed(2) : 0;
    
    console.log('\n💰 Revenue Analysis:');
    console.log(`   Average order value: ₦${avgOrderValue}`);
    console.log(`   Average basic custom order value: ₦${avgBasicCustomOrderValue}`);
    console.log(`   Basic custom orders as % of total: ${((basicCustomOrdersCount / createdOrders.length) * 100).toFixed(1)}%`);
    console.log(`   Success rate (paid orders): ${((paidOrders.length / createdOrders.length) * 100).toFixed(1)}%`);
    
    // Category popularity
    const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    console.log('\n📊 Category Popularity:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : 0;
      console.log(`   ${category}: ${count} items (${percentage}%)`);
    });
    
    mongoose.connection.close();
    console.log('\n✅ Regular orders seeding completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error seeding regular orders: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedOrders();