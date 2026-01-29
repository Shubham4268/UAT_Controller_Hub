import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Load environment variables from .env.local, .env, etc.
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SEED_USER = {
  name: 'System Admin',
  username: 'Admin.User',
  password: 'Admin@123',
  role: 'admin',
  email: 'admin@teamboard.com' // Dummy email to satisfy unique constraint if sparse
};

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Check if user exists (username is normalized to lowercase by the model, so we search lowercase)
    const normalizedUsername = SEED_USER.username.toLowerCase();
    const existingUser = await User.findOne({
      username: normalizedUsername
    });

    if (existingUser) {
      console.log(`User '${normalizedUsername}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating user '${SEED_USER.username}'...`);

    // Hash password
    const hashedPassword = await bcrypt.hash(SEED_USER.password, 12);

    // Create user
    await User.create({
      name: SEED_USER.name,
      username: SEED_USER.username,
      password: hashedPassword,
      role: SEED_USER.role,
      email: SEED_USER.email,
    });

    console.log('Admin user seeded successfully!');

  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedAdmin();
