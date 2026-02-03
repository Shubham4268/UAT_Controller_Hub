import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }
    return mongoose.connect(MONGODB_URI);
}

export async function GET() {
    try {
        await connectToDatabase();
        const currentUser = await getAuthUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Lead Dashboard: Display a list of all registered testers.
        if (currentUser.role !== ROLES.LEAD && currentUser.role !== ROLES.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all users with role TESTER or LEAD
        const testers = await User.find({ role: { $in: [ROLES.TESTER, ROLES.LEAD] } })
            .select('name username email image role devices createdAt') // Select public fields
            .sort({ name: 1 });

        return NextResponse.json(testers);
    } catch (error) {
        console.error('Error fetching testers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
