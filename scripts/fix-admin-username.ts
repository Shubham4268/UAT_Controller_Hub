/**
 * Fix Admin Username Script
 *
 * This script updates the existing admin user's username to lowercase
 * to fix case-insensitive authentication issues.
 *
 * Run with: npx tsx scripts/fix-admin-username.ts
 */

import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamboard';

async function fixAdminUsername() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user with old mixed-case username
    const oldAdmin = await User.findOne({
      $or: [
        { username: 'Admin.User' },
        { username: /^admin\.user$/i }, // Case-insensitive search
      ],
      role: 'admin',
    });

    if (!oldAdmin) {
      console.log('No admin user found with mixed-case username.');
      console.log('Checking for lowercase admin...');

      const lowercaseAdmin = await User.findOne({ username: 'admin.user' });
      if (lowercaseAdmin) {
        console.log('✓ Admin user already has correct lowercase username');
      } else {
        console.log('⚠ No admin user found. Please run seed-admin.ts to create one.');
      }

      await mongoose.disconnect();
      return;
    }

    // Update username to lowercase
    oldAdmin.username = 'admin.user';
    await oldAdmin.save(); // Pre-save hook will normalize it

    console.log('✓ Admin username updated successfully');
    console.log('  New username:', oldAdmin.username);
    console.log('\nYou can now log in with:');
    console.log('  Username: admin.user (or any casing)');
    console.log('  Password: Admin@123');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error fixing admin username:', error);
    process.exit(1);
  }
}

fixAdminUsername();
