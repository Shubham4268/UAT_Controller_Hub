import { NextResponse } from 'next/server';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongo';

// GET /api/profile/devices
export async function GET() {
    try {
        await connectDB();
        const authUser = await getAuthUser();
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findById(authUser.userId).select('devices');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user.devices || []);
    } catch (error) {
        console.error('Error fetching devices:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST /api/profile/devices
export async function POST(request: Request) {
    try {
        await connectDB();
        const authUser = await getAuthUser();
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { deviceName, osVersion } = await request.json();

        // Validation
        if (!deviceName || !osVersion) {
            return NextResponse.json({ error: 'Device Name and OS Version are required' }, { status: 400 });
        }
        if (deviceName.length > 50 || osVersion.length > 50) {
            return NextResponse.json({ error: 'Maximum length is 50 characters' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            authUser.userId,
            { $push: { devices: { deviceName, osVersion } } },
            { new: true, runValidators: true }
        );

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Return the newly added device (the last one in the array)
        const newDevice = user.devices[user.devices.length - 1];
        return NextResponse.json(newDevice);
    } catch (error) {
        console.error('Error adding device:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
