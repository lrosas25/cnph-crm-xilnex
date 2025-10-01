const mongoose = require('mongoose');
require('dotenv').config();
const Outlet = require('../src/models/Outlet');

const outletsData = [
  {
    name: 'Training Outlet',
    code: 'TRAIN',
    description: 'Training and demo outlet for staff learning and customer demos',
    address: {
      street: '123 Training Street',
      city: 'Manila',
      state: 'Metro Manila',
      zipCode: '1000',
      country: 'Philippines'
    },
    phone: '+63917123456',
    email: 'training@company.com',
    manager: 'Training Manager',
    status: 'active',
    type: 'store'
  },
  {
    name: 'Main Store',
    code: 'MAIN',
    description: 'Primary retail location and flagship store',
    address: {
      street: '456 Main Avenue',
      city: 'Manila',
      state: 'Metro Manila',
      zipCode: '1001',
      country: 'Philippines'
    },
    phone: '+63917234567',
    email: 'main@company.com',
    manager: 'Store Manager',
    status: 'active',
    type: 'store'
  },
  {
    name: 'Branch 1',
    code: 'BR1',
    description: 'First branch location in Quezon City',
    address: {
      street: '789 Branch Road',
      city: 'Quezon City',
      state: 'Metro Manila',
      zipCode: '1100',
      country: 'Philippines'
    },
    phone: '+63917345678',
    email: 'branch1@company.com',
    manager: 'Branch Manager 1',
    status: 'active',
    type: 'store'
  },
  {
    name: 'Branch 2',
    code: 'BR2',
    description: 'Second branch location in Makati',
    address: {
      street: '321 Business District',
      city: 'Makati',
      state: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines'
    },
    phone: '+63917456789',
    email: 'branch2@company.com',
    manager: 'Branch Manager 2',
    status: 'active',
    type: 'store'
  },
  {
    name: 'Online Store',
    code: 'ONLINE',
    description: 'E-commerce platform and online sales channel',
    address: {
      street: '999 Digital Plaza',
      city: 'Taguig',
      state: 'Metro Manila',
      zipCode: '1600',
      country: 'Philippines'
    },
    phone: '+63917567890',
    email: 'online@company.com',
    manager: 'E-commerce Manager',
    status: 'active',
    type: 'online'
  },
  {
    name: 'Main Warehouse',
    code: 'WH1',
    description: 'Primary storage and distribution center',
    address: {
      street: '555 Industrial Zone',
      city: 'Marikina',
      state: 'Metro Manila',
      zipCode: '1800',
      country: 'Philippines'
    },
    phone: '+63917678901',
    email: 'warehouse@company.com',
    manager: 'Warehouse Manager',
    status: 'active',
    type: 'warehouse'
  }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedOutlets = async () => {
  try {
    console.log('🌱 Starting outlet seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing outlets
    await Outlet.deleteMany({});
    console.log('🗑️  Cleared existing outlets');
    
    // Insert new outlets
    const createdOutlets = await Outlet.insertMany(outletsData);
    console.log(`✅ Created ${createdOutlets.length} outlets`);
    
    // Display created outlets
    createdOutlets.forEach(outlet => {
      console.log(`   - ${outlet.displayName} (${outlet.status})`);
    });
    
    console.log('🎉 Outlet seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding outlets:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
if (require.main === module) {
  seedOutlets();
}

module.exports = { seedOutlets };