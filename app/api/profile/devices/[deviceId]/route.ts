import { NextResponse } from 'next/server';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongo';

// PUT /api/profile/devices/[deviceId]
export async function PUT(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
    try {
        await connectDB();
        const { deviceId } = await params;
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

        const user = await User.findOneAndUpdate(
            { _id: authUser.userId, 'devices._id': deviceId },
            { 
                $set: { 
                    'devices.$.deviceName': deviceName,
                    'devices.$.osVersion': osVersion
                } 
            },
            { new: true, runValidators: true }
        );

        if (!user) return NextResponse.json({ error: 'User or Device not found' }, { status: 404 });

        const updatedDevice = user.devices.find(d => (d as any)._id.toString() === deviceId);
        return NextResponse.json(updatedDevice);
    } catch (error) {
        console.error('Error updating device:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/profile/devices/[deviceId]
export async function DELETE(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
    try {
        await connectDB();
        const { deviceId } = await params;
        const authUser = await getAuthUser();
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findByIdAndUpdate(
            authUser.userId,
            { $pull: { devices: { _id: deviceId } } },
            { new: true }
        );

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ message: 'Device removed successfully' });
    } catch (error) {
        console.error('Error deleting device:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
