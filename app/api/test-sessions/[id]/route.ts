import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import TestSession from '@/models/TestSession';
import { getAuthUser } from '@/lib/auth/auth';

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
