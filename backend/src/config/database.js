const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGODB_URI or fall back to MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('No MongoDB connection string found. Please set MONGODB_URI or MONGO_URI environment variable.');
    }
    
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 URI:', mongoUri.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;