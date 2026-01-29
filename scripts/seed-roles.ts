import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { ROLES } from '../config/roles';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SEED_USERS = [
    {
        name: 'Lead User',
        username: 'Lead.User',
        password: 'Lead@123',
        role: ROLES.LEAD,
        email: 'lead@teamboard.com'
    },
    {
        name: 'Tester One',
        username: 'Tester.One',
        password: 'Tester@123',
        role: ROLES.TESTER,
        email: 'tester.one@teamboard.com'
    },
    {
        name: 'Tester Two',
        username: 'Tester.Two',
        password: 'Tester@123',
        role: ROLES.TESTER,
        email: 'tester.two@teamboard.com'
    },
    {
        name: 'Tester Three',
        username: 'Tester.Three',
        password: 'Tester@123',
        role: ROLES.TESTER,
        email: 'tester.three@teamboard.com'
    }
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

        console.log('Roles seeded successfully!');

    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

seedRoles();
