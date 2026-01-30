import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { ROLES } from '../config/roles';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const COMMON_PASSWORD = 'Test@123';

// Explicit LEAD users
const LEAD_USERS = [
  'Anagha.Shinde',
  'Vishnu1.Menon',
];

// All TESTER users
const TESTER_USERS = [
  'Anushree1.Shukla',
  'Avinash10.Gupta',
  'Bhavya.Momaya',
  'Devraj3.Singh',
  'Dhiraj.Kunder',
  'Jaypal.Koli',
  'Manoj.Inbarajan',
  'Mridul.Upadhya',
  'Nikita.Sonawane',
  'Nikita.Suhane',
  'Omkar.Ghodake',
  'Rishabh.Kanaujiya',
  'Sakshi1.Rai',
  'Sanjeev2.Prajapati',
  'Shubham2.Joshi',
  'Umakant.Patil',
];

// Helper to build user objects
function buildUser(username, role) {
  return {
    name: username.replace('.', ' '),
    username,
    password: COMMON_PASSWORD,
    role,
    email: `${username.toLowerCase()}@teamboard.com`,
  };
}

// Combine all users
const SEED_USERS = [
  ...LEAD_USERS.map(u => buildUser(u, ROLES.LEAD)),
  ...TESTER_USERS.map(u => buildUser(u, ROLES.TESTER)),
];

async function seedRoles() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    for (const user of SEED_USERS) {
      const normalizedUsername = user.username.toLowerCase();
      const existingUser = await User.findOne({ username: normalizedUsername });

      if (existingUser) {
        console.log(`User '${normalizedUsername}' already exists. Skipping.`);
        continue;
      }

      console.log(`Creating user '${user.username}' (${user.role})...`);

      const hashedPassword = await bcrypt.hash(user.password, 12);

      await User.create({
        name: user.name,
        username: user.username,
        password: hashedPassword,
        role: user.role,
        email: user.email,
      });
    }

    console.log('Users seeded successfully!');

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedRoles();
