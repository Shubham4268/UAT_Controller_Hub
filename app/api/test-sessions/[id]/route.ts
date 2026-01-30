import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import TestSession from '@/models/TestSession';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session_auth = await getAuthUser();
        if (!session_auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();
        const testSession = await TestSession.findById(id);

        if (!testSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(testSession);
    } catch (error: any) {
        console.error('Error fetching test session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session_auth = await getAuthUser();
        if (!session_auth || (session_auth.role !== ROLES.LEAD && session_auth.role !== ROLES.ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status || !['ACTIVE', 'STOPPED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();

        const updateData: any = { status };
        if (status === 'ACTIVE') {
            updateData.startedAt = new Date();
        } else if (status === 'STOPPED') {
            updateData.stoppedAt = new Date();
        }

        const testSession = await TestSession.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!testSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(testSession);
    } catch (error: any) {
        console.error('Error updating test session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
