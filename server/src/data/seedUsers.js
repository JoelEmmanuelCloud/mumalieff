/**
 * User Seeder Script
 * 
 * Usage: node data/seedUsers.js
 */
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

mongoose.connect('r0')
  .then(() => console.log('MongoDB connected for seeding users'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample user data with Nigerian context
const sampleUsers = [
  // Admin User
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@mumalieff.com',
    password: 'admin123456',
    phone: '+2348000000000',
    isAdmin: true,
    shippingAddresses: [
      {
        address: '1 Mumalieff Headquarters, Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '101233',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  // Regular Users
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+2348023456789',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '23 Broad Street',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '101233',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Amina',
    lastName: 'Ibrahim',
    email: 'amina@example.com',
    password: 'password123',
    phone: '+2348034567890',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '45 Ahmadu Bello Way',
        city: 'Kaduna',
        state: 'Kaduna',
        postalCode: '800283',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Chukwu',
    lastName: 'Emeka',
    email: 'emeka@example.com',
    password: 'password123',
    phone: '+2348045678901',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '12 Okpara Avenue',
        city: 'Enugu',
        state: 'Enugu',
        postalCode: '400281',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Blessing',
    lastName: 'Okonkwo',
    email: 'blessing@example.com',
    password: 'password123',
    phone: '+2348056789012',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '78 Aba Road',
        city: 'Port Harcourt',
        state: 'Rivers',
        postalCode: '500272',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Yusuf',
    lastName: 'Mohammed',
    email: 'yusuf@example.com',
    password: 'password123',
    phone: '+2348067890123',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '34 Ibrahim Taiwo Road',
        city: 'Kano',
        state: 'Kano',
        postalCode: '700241',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Folake',
    lastName: 'Adeyemi',
    email: 'folake@example.com',
    password: 'password123',
    phone: '+2348078901234',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '56 Awolowo Road',
        city: 'Ibadan',
        state: 'Oyo',
        postalCode: '200223',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Obinna',
    lastName: 'Nwachukwu',
    email: 'obinna@example.com',
    password: 'password123',
    phone: '+2348089012345',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '90 Ogui Road',
        city: 'Nsukka',
        state: 'Enugu',
        postalCode: '410001',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Fatima',
    lastName: 'Abubakar',
    email: 'fatima@example.com',
    password: 'password123',
    phone: '+2348090123456',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '23 Shehu Shagari Way',
        city: 'Abuja',
        state: 'FCT',
        postalCode: '900288',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'David',
    lastName: 'Okafor',
    email: 'david@example.com',
    password: 'password123',
    phone: '+2349012345678',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '45 New Market Road',
        city: 'Onitsha',
        state: 'Anambra',
        postalCode: '420001',
        country: 'Nigeria',
        isDefault: true
      },
      {
        address: '12 Stadium Road',
        city: 'Enugu',
        state: 'Enugu',
        postalCode: '400222',
        country: 'Nigeria',
        isDefault: false
      }
    ]
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    password: 'password123',
    phone: '+2349023456789',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '78 Adeola Hopewell Street',
        city: 'Victoria Island',
        state: 'Lagos',
        postalCode: '101233',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Michael',
    lastName: 'Adeleke',
    email: 'michael@example.com',
    password: 'password123',
    phone: '+2349034567890',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '56 Ring Road',
        city: 'Ibadan',
        state: 'Oyo',
        postalCode: '200284',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Grace',
    lastName: 'Okechukwu',
    email: 'grace@example.com',
    password: 'password123',
    phone: '+2349045678901',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '23 Independence Layout',
        city: 'Enugu',
        state: 'Enugu',
        postalCode: '400285',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Ahmad',
    lastName: 'Hassan',
    email: 'ahmad@example.com',
    password: 'password123',
    phone: '+2349056789012',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '67 Gidado Road',
        city: 'Kaduna',
        state: 'Kaduna',
        postalCode: '800287',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  // Additional users for testing
  {
    firstName: 'Kemi',
    lastName: 'Ogundimu',
    email: 'kemi@example.com',
    password: 'password123',
    phone: '+2349067890123',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '89 Allen Avenue',
        city: 'Ikeja',
        state: 'Lagos',
        postalCode: '100001',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Usman',
    lastName: 'Bello',
    email: 'usman@example.com',
    password: 'password123',
    phone: '+2349078901234',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '45 Constitution Avenue',
        city: 'Abuja',
        state: 'FCT',
        postalCode: '900001',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Chioma',
    lastName: 'Ugwu',
    email: 'chioma@example.com',
    password: 'password123',
    phone: '+2349089012345',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '67 Zik Avenue',
        city: 'Awka',
        state: 'Anambra',
        postalCode: '420211',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim@example.com',
    password: 'password123',
    phone: '+2349090123456',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '78 Yakubu Gowon Way',
        city: 'Jos',
        state: 'Plateau',
        postalCode: '930001',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Ngozi',
    lastName: 'Anyanwu',
    email: 'ngozi@example.com',
    password: 'password123',
    phone: '+2349012346789',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '34 Hospital Road',
        city: 'Owerri',
        state: 'Imo',
        postalCode: '460001',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Tunde',
    lastName: 'Bakare',
    email: 'tunde@example.com',
    password: 'password123',
    phone: '+2349023457890',
    isAdmin: false,
    shippingAddresses: [
      {
        address: '56 Adebayo Doherty Road',
        city: 'Lekki',
        state: 'Lagos',
        postalCode: '106104',
        country: 'Nigeria',
        isDefault: true
      }
    ]
  }
];

const seedUsers = async () => {
  try {
    // Clear existing users
    const deletedCount = await User.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing users`);

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`${createdUsers.length} users inserted successfully!`);
    
    // Separate admin and regular users for logging
    const adminUsers = createdUsers.filter(user => user.isAdmin);
    const regularUsers = createdUsers.filter(user => !user.isAdmin);
    
    console.log('\n👑 Admin Users Created:');
    adminUsers.forEach(user => {
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: admin123456`);
    });
    
    console.log('\n👥 Regular Users Created:');
    console.log(`   Total: ${regularUsers.length} users`);
    console.log('   Password for all: password123');
    
    // Show some sample users
    console.log('\n📝 Sample Regular Users:');
    regularUsers.slice(0, 5).forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} - ${user.email}`);
    });
    if (regularUsers.length > 5) {
      console.log(`   ... and ${regularUsers.length - 5} more users`);
    }
    
    console.log('\n📊 User Summary:');
    console.log(`   Total users: ${createdUsers.length}`);
    console.log(`   Admin users: ${adminUsers.length}`);
    console.log(`   Regular users: ${regularUsers.length}`);
    
    // Show distribution by states
    const stateDistribution = {};
    createdUsers.forEach(user => {
      if (user.shippingAddresses && user.shippingAddresses.length > 0) {
        const state = user.shippingAddresses[0].state;
        stateDistribution[state] = (stateDistribution[state] || 0) + 1;
      }
    });
    
    console.log('\n🌍 Geographic Distribution:');
    Object.entries(stateDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`   ${state}: ${count} user${count > 1 ? 's' : ''}`);
      });
    
    console.log('\n✅ User seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error seeding users: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

seedUsers();