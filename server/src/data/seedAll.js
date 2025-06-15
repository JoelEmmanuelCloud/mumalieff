/**
 * Master Seeder Script - Updated for New Two-Category Structure
 * Creates complete sample data for Mumalieff platform
 * 
 * Usage: node data/seedAllSimple.js
 */
const { exec } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const runSeeder = (scriptName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`\n🌱 Running ${scriptName}...`);
    console.log('━'.repeat(60));
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error in ${scriptName}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️  Warning in ${scriptName}:`, stderr);
      }
      
      console.log(`✅ ${scriptName} completed successfully`);
      console.log(stdout);
      console.log('━'.repeat(60));
      resolve();
    });
  });
};

const seedAll = async () => {
  try {
    console.log('🚀 MUMALIEFF DATABASE SEEDING PROCESS');
    console.log('=' .repeat(60));
    console.log('📝 Creating sample data for the new two-category structure:');
    console.log('   • Wear Your Conviction (inspirational designs)');
    console.log('   • Customize Your Prints (custom products)');
    console.log('=' .repeat(60));
    
    // Run seeders in the correct order
    console.log('\n🔄 SEEDING SEQUENCE:');
    
    // 1. Users (including admin)
    console.log('1️⃣  Creating users (admin + customers)...');
    await runSeeder('seedUsers.js');
    
    // 2. Products with new categories
    console.log('2️⃣  Creating products with new category structure...');
    await runSeeder('seedProductsSimple.js');
    
    // 3. Reviews for products
    console.log('3️⃣  Adding customer reviews to products...');
    await runSeeder('seedReviewsSimple.js');
    
    // 4. Regular orders
    console.log('4️⃣  Creating regular orders...');
    await runSeeder('seedOrdersSimple.js');
    
    // 5. Custom orders (new!)
    console.log('5️⃣  Creating custom design orders...');
    await runSeeder('seedCustomOrdersSimple.js');
    
    console.log('\n🎉 ALL SEEDERS COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 WHAT WAS CREATED:');
    console.log('✅ Users: 1 admin + 12 customers (all Nigerian addresses)');
    console.log('✅ Products: 12 total products');
    console.log('   • 6 "Wear Your Conviction" (inspirational designs)');
    console.log('   • 6 "Customize Your Prints" (customizable products)');
    console.log('✅ Reviews: ~30-60 reviews across all products');
    console.log('✅ Regular Orders: ~15-30 standard orders');
    console.log('✅ Custom Orders: ~10-30 custom design orders');
    
    console.log('\n🔑 ADMIN ACCESS:');
    console.log('📧 Email: admin@mumalieff.com');
    console.log('🔒 Password: admin123');
    
    console.log('\n👤 SAMPLE CUSTOMER ACCESS:');
    console.log('📧 Email: john@example.com');
    console.log('🔒 Password: password123');
    
    console.log('\n📊 CATEGORY BREAKDOWN:');
    console.log('🙏 WEAR YOUR CONVICTION:');
    console.log('   • Faith Over Fear T-Shirt (Religious/Spiritual)');
    console.log('   • Blessed & Grateful Tee (Religious/Spiritual)');
    console.log('   • Dream Big Achieve More (Motivational)');
    console.log('   • Love Wins Always (Motivational)');
    console.log('   • Be the Change Quote Tee (Motivational)');
    console.log('   • Purpose Driven Life Tee (Religious/Spiritual)');
    
    console.log('\n🎨 CUSTOMIZE YOUR PRINTS:');
    console.log('   • Custom Photo Print T-Shirt');
    console.log('   • Your Text Here Custom Tee');
    console.log('   • Custom Logo/Brand Tee');
    console.log('   • Family Photo Collage Tee');
    console.log('   • Custom Sports Jersey');
    console.log('   • Anniversary/Wedding Custom Tee');
    
    console.log('\n🛒 ORDER TYPES CREATED:');
    console.log('📦 Regular Orders: Standard product purchases');
    console.log('🎨 Custom Orders: Design uploads, text customization, logos');
    console.log('💰 Payment Methods: Paystack card/transfer, mobile money');
    console.log('🚚 Shipping: Nigerian addresses across all states');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Start your application server');
    console.log('2. Login as admin to manage products/orders');
    console.log('3. Test customer flows with sample users');
    console.log('4. Review custom order management features');
    console.log('5. Test both product categories');
    
    console.log('\n💡 FEATURES TO TEST:');
    console.log('• Browse by category (Conviction vs Custom)');
    console.log('• Custom design upload process');
    console.log('• Order status tracking');
    console.log('• Review and rating system');
    console.log('• Admin order management dashboard');
    
    console.log('\n=' .repeat(60));
    console.log('🌟 MUMALIEFF SEEDING COMPLETE! 🌟');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 SEEDING PROCESS FAILED');
    console.error('=' .repeat(60));
    console.error('Error:', error.message);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('1. Check MongoDB connection');
    console.error('2. Verify all model files exist');
    console.error('3. Ensure .env file is configured');
    console.error('4. Check file permissions');
    console.error('=' .repeat(60));
    process.exit(1);
  }
};

seedAll();