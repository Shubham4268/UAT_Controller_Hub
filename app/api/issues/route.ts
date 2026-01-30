import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { sessionId, title, description, media } = body;

        if (!sessionId || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const issue = await Issue.create({
            sessionId,
            testerId: session.userId,
            title,
            description,
            media,
            status: 'SUBMITTED',
        });

        const populatedIssue = await Issue.findById(issue._id).populate('testerId', 'name username image');

        return NextResponse.json(populatedIssue, { status: 201 });
    } catch (error: any) {
        console.error('Error creating issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        await connectDB();

        // Testers see only their own issues for that session
        // Leads see all issues for that session
        const query: any = { sessionId };
        if (session.role === 'tester') {
            query.testerId = session.userId;
        }

        const issues = await Issue.find(query)
            .populate('testerId', 'name username image')
            .sort({ createdAt: -1 });

        return NextResponse.json(issues);
    } catch (error: any) {
        console.error('Error fetching issues:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
