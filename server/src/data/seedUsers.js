/**
 * User Seeder Script
 * 
 * Usage: node data/seedUsers.js
 */
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding users'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample user data with Nigerian context
const sampleUsers = [

  {
    name: 'John Doe',
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
    name: 'Amina Ibrahim',
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
    name: 'Chukwu Emeka',
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
    name: 'Blessing Okonkwo',
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
    name: 'Yusuf Mohammed',
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
    name: 'Folake Adeyemi',
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
    name: 'Obinna Nwachukwu',
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
    name: 'Fatima Abubakar',
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
    name: 'David Okafor',
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
    name: 'Sarah Johnson',
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
  }
];

const seedUsers = async () => {
  try {


    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`${createdUsers.length} users inserted successfully!`);
    
    // Log admin credentials
    console.log('Admin User Created:');
    console.log('Email: admin@mumalieff.com');
    console.log('Password: admin123');
    
    process.exit();
  } catch (error) {
    console.error(`Error seeding users: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();