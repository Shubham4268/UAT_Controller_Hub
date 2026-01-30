import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import TestSession from '@/models/TestSession';
import Issue from '@/models/Issue';
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
        const { status, completionStatus } = body;

        await connectDB();

        const updateData: any = {};

        if (status) {
            if (!['ACTIVE', 'STOPPED'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            updateData.status = status;
            if (status === 'ACTIVE') {
                updateData.startedAt = new Date();
            } else if (status === 'STOPPED') {
                updateData.stoppedAt = new Date();
            }
        }

        if (completionStatus) {
            if (completionStatus !== 'COMPLETED') {
                return NextResponse.json({ error: 'Invalid completion status' }, { status: 400 });
            }

            // Check eligibility: are all issues validated or NA?
            const pendingIssues = await Issue.countDocuments({
                sessionId: id,
                status: { $nin: ['VALIDATED', 'NA'] }
            });

            if (pendingIssues > 0) {
                return NextResponse.json({
                    error: 'Cannot complete session. All issues must be Validated or NA.'
                }, { status: 400 });
            }

            updateData.completionStatus = 'COMPLETED';
            updateData.completedAt = new Date();
            updateData.status = 'STOPPED'; // Force stop if completed
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
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
