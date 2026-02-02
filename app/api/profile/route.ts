import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth/auth';

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
        const authUser = await getAuthUser();

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch fresh user data
        const user = await User.findById(authUser.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectToDatabase();
        const authUser = await getAuthUser();

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Prevent updating role or other sensitive fields via this endpoint
        const { role, password, username, ...updateData } = body;

        const updatedUser = await User.findByIdAndUpdate(
            authUser.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
