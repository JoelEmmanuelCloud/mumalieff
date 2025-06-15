/**
 * Custom Orders Seeder Script - FIXED
 * Creates realistic custom orders using the new CustomOrder model and Payment model
 * 
 * Usage: node data/seedCustomOrdersSimple.js
 */
const mongoose = require('mongoose');
const CustomOrder = require('../models/customOrderModel');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding custom orders'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Generate realistic Paystack reference (format: mlf_xxxxxxxxx_timestamp)
const generatePaystackReference = () => {
  return `mlf_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

// Generate unique order number
const generateOrderNumber = (index) => {
  const prefix = 'CO'; // Custom Order prefix
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const orderIndex = index.toString().padStart(3, '0'); // 3-digit order index
  return `${prefix}${timestamp}${orderIndex}`;
};

const seedCustomOrders = async () => {
  try {
    // Get users and products from the database
    const users = await User.find({ isAdmin: false }).limit(10);
    const customizableProducts = await Product.find({ 
      category: 'Customize Your Prints',
      allowCustomization: true,
      isActive: true 
    });
    
    if (users.length === 0 || customizableProducts.length === 0) {
      console.error('❌ Please ensure you have users and customizable products in the database first');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users and ${customizableProducts.length} customizable products`);
    
    // Clear existing custom orders and payments
    const deletedOrders = await CustomOrder.deleteMany({});
    const deletedPayments = await Payment.deleteMany({});
    console.log(`🗑️  Cleared ${deletedOrders.deletedCount} existing custom orders and ${deletedPayments.deletedCount} payments`);
    
    // Sample custom design data
    const customDesigns = [
      {
        designUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        designPublicId: 'custom_design_001',
        placement: 'Front',
        size: 'Medium',
        printMethod: 'Digital Print',
        colors: ['#FF0000', '#000000'],
        dimensions: { width: 8, height: 10, unit: 'inches' }
      },
      {
        designUrl: 'https://images.unsplash.com/photo-1611095973362-bed61969f37a?w=400',
        designPublicId: 'custom_design_002',
        placement: 'Back',
        size: 'Large',
        printMethod: 'Screen Print',
        colors: ['#0000FF', '#FFFFFF'],
        dimensions: { width: 10, height: 12, unit: 'inches' }
      },
      {
        designUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
        designPublicId: 'custom_design_003',
        placement: 'Left Chest',
        size: 'Small',
        printMethod: 'Embroidery',
        colors: ['#FFD700', '#000000'],
        dimensions: { width: 4, height: 4, unit: 'inches' }
      },
      {
        designUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400',
        designPublicId: 'custom_design_004',
        placement: 'Front',
        size: 'Large',
        printMethod: 'Heat Transfer',
        colors: ['#008000', '#FFFFFF'],
        dimensions: { width: 9, height: 11, unit: 'inches' }
      },
      {
        designUrl: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?w=400',
        designPublicId: 'custom_design_005',
        placement: 'Right Sleeve',
        size: 'Medium',
        printMethod: 'Vinyl',
        colors: ['#800080', '#FFFF00'],
        dimensions: { width: 3, height: 6, unit: 'inches' }
      }
    ];
    
    // Special instructions examples
    const specialInstructions = [
      'Please make sure the text is centered perfectly',
      'This is a gift - please package nicely',
      'Rush order needed for anniversary',
      'Please use high-quality vinyl for durability',
      'Make sure colors are vibrant and pop',
      'This design represents our family business logo',
      'Please review design carefully before printing',
      'Ensure embroidery is smooth and professional',
      null, // Some orders don't have special instructions
      'Please call before starting production'
    ];
    
    // Customer notes examples
    const customerNotes = [
      'Thank you for the great service!',
      'Looking forward to seeing the final product',
      'This is my first custom order, please take care',
      'Hope the design turns out as expected',
      'Excited to wear this custom piece',
      null, // Some don't have notes
      'Please let me know if you need clarification',
      'This design has sentimental value to me'
    ];
    
    // Admin notes examples
    const adminNotes = [
      'Customer provided high-quality design file',
      'May need to adjust colors for better printing',
      'Design approved by design team',
      'Rush order - prioritize in production queue',
      'Customer prefers eco-friendly inks',
      'Design requires special attention to detail',
      null, // Some orders don't have admin notes
      'Good repeat customer - ensure quality'
    ];
    
    // Nigerian locations for shipping
    const nigerianLocations = [
      { street: '15 Adebayo Mokuolu Street', city: 'Anthony', state: 'Lagos', zipCode: '101233' },
      { street: '67 Wuse Zone 3', city: 'Abuja', state: 'FCT', zipCode: '900288' },
      { street: '23 Aba Road', city: 'Port Harcourt', state: 'Rivers', zipCode: '500272' },
      { street: '89 Zoo Road', city: 'Kano', state: 'Kano', zipCode: '700241' },
      { street: '45 Dugbe Market Road', city: 'Ibadan', state: 'Oyo', zipCode: '200223' },
      { street: '12 Ahmadu Bello Way', city: 'Kaduna', state: 'Kaduna', zipCode: '800283' },
      { street: '56 Ogui Road', city: 'Enugu', state: 'Enugu', zipCode: '400281' },
      { street: '34 Main Market Road', city: 'Onitsha', state: 'Anambra', zipCode: '420001' }
    ];
    
    const sampleCustomOrders = [];
    const samplePayments = [];
    let totalOrdersCreated = 0;
    let globalOrderIndex = 1; // Global counter for unique order numbers
    
    // Create 1-3 custom orders per user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const numOrders = Math.floor(Math.random() * 3) + 1; // 1-3 orders per user
      
      console.log(`\n🎨 Creating ${numOrders} custom order(s) for: ${user.name}`);
      
      for (let j = 0; j < numOrders; j++) {
        // Select random customizable product
        const baseProduct = customizableProducts[Math.floor(Math.random() * customizableProducts.length)];
        
        // Select random design
        const customDesign = customDesigns[Math.floor(Math.random() * customDesigns.length)];
        
        // Select product details
        const productSize = baseProduct.sizes[Math.floor(Math.random() * baseProduct.sizes.length)];
        const productColor = baseProduct.colors[Math.floor(Math.random() * baseProduct.colors.length)];
        
        // Quantity (1-3 for custom orders)
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        // Pricing
        const basePrice = baseProduct.price;
        const customizationPrice = baseProduct.customizationOptions?.customizationPrice || 1500;
        const isRushOrder = Math.random() < 0.2; // 20% chance of rush order
        const rushOrderFee = isRushOrder ? 2000 : 0;
        
        // Calculate completion days
        const estimatedCompletionDays = isRushOrder ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 5) + 5; // 2-3 days for rush, 5-9 days for normal
        const rushOrderDays = isRushOrder ? Math.floor(Math.random() * 2) + 2 : undefined;
        
        // Order status - weighted towards active statuses
        const statusWeights = {
          'pending': 0.15,
          'design_review': 0.15,
          'approved': 0.20,
          'in_production': 0.25,
          'quality_check': 0.10,
          'shipped': 0.08,
          'delivered': 0.05,
          'cancelled': 0.02,
          'revision_needed': 0.05
        };
        
        const randomValue = Math.random();
        let cumulativeWeight = 0;
        let orderStatus = 'pending';
        
        for (const [status, weight] of Object.entries(statusWeights)) {
          cumulativeWeight += weight;
          if (randomValue <= cumulativeWeight) {
            orderStatus = status;
            break;
          }
        }
        
        // Random dates in the past 60 days
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);
        
        // ✅ FIXED: Shipping address structure to match CustomOrder schema
        const location = nigerianLocations[Math.floor(Math.random() * nigerianLocations.length)];
        const shippingAddress = {
          street: location.street,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          country: 'Nigeria'
        };
        
        // ✅ FIXED: Payment status mapping to match CustomOrder schema
        let paymentStatus;
        if (orderStatus === 'cancelled') {
          paymentStatus = 'failed'; // CustomOrder uses 'failed' not 'cancelled'
        } else if (['delivered', 'shipped', 'quality_check', 'in_production', 'approved'].includes(orderStatus)) {
          paymentStatus = 'paid'; // CustomOrder uses 'paid' not 'success'
        } else {
          // For pending, design_review, revision_needed
          const statusRandom = Math.random();
          if (statusRandom < 0.6) paymentStatus = 'paid';
          else if (statusRandom < 0.8) paymentStatus = 'pending';
          else paymentStatus = 'failed';
        }
        
        // Payment timing
        const paymentInitiatedAt = new Date(orderDate.getTime() + Math.random() * 30 * 60 * 1000); // Within 30 minutes of order
        const paidAt = paymentStatus === 'paid' ? 
          new Date(paymentInitiatedAt.getTime() + Math.random() * 10 * 60 * 1000) : undefined; // Within 10 minutes of initiation
        
        // Contact preferences
        const contactPreferences = {
          email: true,
          sms: Math.random() < 0.6,
          whatsapp: Math.random() < 0.4
        };
        
        // Create timeline based on status
        const timeline = {
          orderReceived: orderDate
        };
        
        if (['approved', 'in_production', 'quality_check', 'shipped', 'delivered'].includes(orderStatus)) {
          timeline.designApproved = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }
        if (['in_production', 'quality_check', 'shipped', 'delivered'].includes(orderStatus)) {
          timeline.productionStarted = new Date(timeline.designApproved.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }
        if (['quality_check', 'shipped', 'delivered'].includes(orderStatus)) {
          timeline.qualityCheckCompleted = new Date(timeline.productionStarted.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }
        if (['shipped', 'delivered'].includes(orderStatus)) {
          timeline.shipped = new Date(timeline.qualityCheckCompleted.getTime() + Math.random() * 12 * 60 * 60 * 1000);
        }
        if (orderStatus === 'delivered') {
          timeline.delivered = new Date(timeline.shipped.getTime() + Math.random() * 72 * 60 * 60 * 1000);
          timeline.actualCompletion = timeline.delivered;
        }
        
        // Estimated completion
        const estimatedCompletion = new Date(orderDate);
        estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedCompletionDays);
        timeline.estimatedCompletion = estimatedCompletion;
        
        // Design feedback
        const designFeedback = {
          approved: ['approved', 'in_production', 'quality_check', 'shipped', 'delivered'].includes(orderStatus),
          revisionNotes: orderStatus === 'revision_needed' ? 'Please adjust the text size and center it better' : undefined,
          approvedAt: timeline.designApproved
        };
        
        // Generate unique order number
        const orderNumber = generateOrderNumber(globalOrderIndex);
        
        // ✅ FIXED: Calculate pricing details with correct field names
        const subtotal = (basePrice + customizationPrice + rushOrderFee) * quantity;
        const taxRate = 0.075; // 7.5% VAT in Nigeria
        const tax = Math.round(subtotal * taxRate);
        const shippingCost = quantity > 2 ? 2000 : 1500; // Higher shipping for more items
        const totalPrice = subtotal + tax + shippingCost;
        
        // Generate payment reference for non-pending payments
        const paymentReference = paymentStatus !== 'pending' ? generatePaystackReference() : undefined;
        
        // ✅ FIXED: Create custom order object matching CustomOrder schema exactly
        const customOrder = {
          orderNumber,
          user: user._id,
          baseProduct: baseProduct._id,
          customDesign: {
            designUrl: customDesign.designUrl,
            designPublicId: customDesign.designPublicId,
            placement: customDesign.placement,
            size: customDesign.size,
            printMethod: customDesign.printMethod,
            colors: customDesign.colors,
            dimensions: customDesign.dimensions
          },
          productDetails: {
            size: productSize.name,
            color: {
              name: productColor.name,
              colorCode: productColor.colorCode
            },
            material: baseProduct.material || 'Cotton'
          },
          quantity,
          pricing: {
            basePrice,
            customizationPrice,
            rushOrderFee,
            subtotal,
            tax,
            totalPrice
          },
          specialInstructions: specialInstructions[Math.floor(Math.random() * specialInstructions.length)],
          contactPreferences,
          status: orderStatus,
          timeline,
          estimatedCompletionDays,
          isRushOrder,
          rushOrderDays,
          designFeedback,
          adminNotes: adminNotes[Math.floor(Math.random() * adminNotes.length)],
          customerNotes: customerNotes[Math.floor(Math.random() * customerNotes.length)],
          // ✅ FIXED: Use shippingInfo.address structure that matches CustomOrder schema
          shippingInfo: {
            address: shippingAddress,
            method: ['standard', 'express'][Math.floor(Math.random() * 2)],
            trackingNumber: ['shipped', 'delivered'].includes(orderStatus) ? 
              `MLF${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}NG` : undefined,
            carrier: ['shipped', 'delivered'].includes(orderStatus) ? 
              ['DHL', 'UPS', 'FedEx', 'GIG Logistics'][Math.floor(Math.random() * 4)] : undefined,
            shippedDate: timeline.shipped,
            estimatedDelivery: timeline.shipped ? 
              new Date(timeline.shipped.getTime() + 3 * 24 * 60 * 60 * 1000) : undefined,
            actualDelivery: timeline.delivered
          },
          // ✅ FIXED: Remove payment method enum and use only valid payment status
          payment: {
            status: paymentStatus,
            transactionId: paymentReference,
            paidAt: paidAt
          },
          createdAt: orderDate,
          updatedAt: orderStatus === 'pending' ? orderDate : 
            new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        };
        
        sampleCustomOrders.push(customOrder);
        
        // Create corresponding payment record if payment was attempted
        if (paymentStatus !== 'pending') {
          // ✅ FIXED: Use correct payment status for Payment model  
          const paymentRecord = {
            // order: will be set after order creation
            user: user._id,
            paymentMethod: 'paystack',
            amount: totalPrice, // Use totalPrice instead of totalAmount
            currency: 'NGN',
            status: paymentStatus === 'paid' ? 'success' : paymentStatus, // Convert to Payment model format
            transactionReference: paymentReference,
            paymentGatewayResponse: {
              // Simplified response object
              reference: paymentReference,
              amount: totalPrice * 100,
              status: paymentStatus === 'paid' ? 'success' : 'failed',
              gateway_response: paymentStatus === 'paid' ? 'Successful' : 'Failed'
            },
            failureReason: paymentStatus === 'failed' ? 
              ['Insufficient funds', 'Card declined', 'Invalid PIN', 'Transaction timeout', 'Network error'][Math.floor(Math.random() * 5)] : undefined,
            webhookVerified: paymentStatus === 'paid',
            paidAt: paidAt,
            customerEmail: user.email,
            initiatedAt: paymentInitiatedAt,
            createdAt: paymentInitiatedAt,
            updatedAt: paidAt || paymentInitiatedAt
          };
          
          samplePayments.push(paymentRecord);
        }
        
        totalOrdersCreated++;
        globalOrderIndex++; // Increment global order counter
        
        console.log(`   🎨 Custom Order ${j + 1} (${orderNumber}): ${baseProduct.name}, ${quantity}x, ${orderStatus}, ${paymentStatus}, ₦${(totalPrice / 100).toFixed(2)}`);
      }
    }
    
    // Insert custom orders first
    console.log(`\n💾 Saving ${sampleCustomOrders.length} custom orders to database...`);
    const createdOrders = await CustomOrder.insertMany(sampleCustomOrders);
    
    // Update payment records with order IDs and insert
    if (samplePayments.length > 0) {
      console.log(`💳 Saving ${samplePayments.length} payment records to database...`);
      
      let paymentIndex = 0;
      for (let i = 0; i < createdOrders.length; i++) {
        const order = createdOrders[i];
        
        // Find corresponding payment (if exists)
        if (order.payment?.transactionId && paymentIndex < samplePayments.length) {
          const payment = samplePayments[paymentIndex];
          if (payment.transactionReference === order.payment.transactionId) {
            payment.order = order._id;
            paymentIndex++;
          }
        }
      }
      
      const createdPayments = await Payment.insertMany(samplePayments);
      console.log(`💳 Successfully created ${createdPayments.length} payment records!`);
    }
    
    console.log(`🎉 Successfully created ${createdOrders.length} custom orders!`);
    
    // Summary statistics
    const statusCounts = {};
    const paymentStatusCounts = {};
    let totalRevenue = 0;
    let rushOrdersCount = 0;
    
    createdOrders.forEach(order => {
      // Count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Calculate revenue (only from paid orders)
      if (order.payment?.status === 'paid') {
        totalRevenue += order.pricing.totalPrice;
      }
      
      // Count rush orders
      if (order.isRushOrder) {
        rushOrdersCount++;
      }
    });
    
    // Get payment statistics
    const allPayments = await Payment.find({});
    allPayments.forEach(payment => {
      paymentStatusCounts[payment.status] = (paymentStatusCounts[payment.status] || 0) + 1;
    });
    
    console.log('\n📊 Custom Orders Summary:');
    console.log(`   Total custom orders: ${createdOrders.length}`);
    console.log(`   Total payment records: ${allPayments.length}`);
    console.log(`   Total revenue: ₦${(totalRevenue / 100).toFixed(2)}`);
    console.log(`   Paid orders: ${createdOrders.filter(o => o.payment?.status === 'paid').length}`);
    console.log(`   Rush orders: ${rushOrdersCount}`);
    
    console.log('\n📈 Order Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });
    
    console.log('\n💳 Payment Status Breakdown:');
    Object.entries(paymentStatusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} payments`);
    });
    
    mongoose.connection.close();
    console.log('\n✅ Custom orders and payments seeding completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error seeding custom orders: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedCustomOrders();