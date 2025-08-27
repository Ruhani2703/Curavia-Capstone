#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedDatabase } = require('../utils/seedData');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curavia';

async function runSeeder() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Run the seeder
    await seedDatabase();
    
    console.log('✅ Seeding completed successfully');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

module.exports = runSeeder;