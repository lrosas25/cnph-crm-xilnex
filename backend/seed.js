const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to database
const connectDB = require('./src/config/database');

// Import models
const User = require('./src/models/User');
const Contact = require('./src/models/Contact');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Contact.deleteMany();

    console.log('🗑️  Existing data cleared');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin',
      department: 'management',
      phone: '+1-555-0001'
    });

    // Create manager user
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@crm.com',
      password: 'manager123',
      role: 'manager',
      department: 'sales',
      phone: '+1-555-0002'
    });

    // Create regular users
    const salesUser1 = await User.create({
      name: 'John Sales',
      email: 'john@crm.com',
      password: 'user123',
      role: 'user',
      department: 'sales',
      phone: '+1-555-0003'
    });

    const salesUser2 = await User.create({
      name: 'Jane Marketing',
      email: 'jane@crm.com',
      password: 'user123',
      role: 'user',
      department: 'marketing',
      phone: '+1-555-0004'
    });

    console.log('👥 Users created');

    // Create sample contacts
    const contacts = [
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@techcorp.com',
        phone: '+1-555-1001',
        company: 'TechCorp Solutions',
        position: 'CEO',
        status: 'prospect',
        source: 'referral',
        assignedTo: salesUser1._id,
        dealValue: 50000,
        notes: 'Interested in enterprise solution'
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@designstudio.com',
        phone: '+1-555-1002',
        company: 'Creative Design Studio',
        position: 'Creative Director',
        status: 'lead',
        source: 'website',
        assignedTo: salesUser1._id,
        dealValue: 25000,
        notes: 'Looking for design collaboration tools'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@retailchain.com',
        phone: '+1-555-1003',
        company: 'Retail Chain Inc',
        position: 'Operations Manager',
        status: 'customer',
        source: 'email_campaign',
        assignedTo: salesUser2._id,
        dealValue: 75000,
        notes: 'Existing customer, potential for upsell'
      },
      {
        firstName: 'Lisa',
        lastName: 'Garcia',
        email: 'lisa.garcia@startup.com',
        phone: '+1-555-1004',
        company: 'Innovative Startup',
        position: 'Founder',
        status: 'lead',
        source: 'social_media',
        assignedTo: salesUser2._id,
        dealValue: 15000,
        notes: 'Early stage startup, budget conscious'
      },
      {
        firstName: 'Robert',
        lastName: 'Miller',
        email: 'robert.miller@consulting.com',
        phone: '+1-555-1005',
        company: 'Business Consulting Group',
        position: 'Senior Consultant',
        status: 'prospect',
        source: 'event',
        assignedTo: managerUser._id,
        dealValue: 100000,
        notes: 'Met at industry conference, high potential'
      }
    ];

    await Contact.insertMany(contacts);

    console.log('📞 Sample contacts created');
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample credentials:');
    console.log('Admin: admin@crm.com / admin123');
    console.log('Manager: manager@crm.com / manager123');
    console.log('User 1: john@crm.com / user123');
    console.log('User 2: jane@crm.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();