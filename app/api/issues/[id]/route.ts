import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const issue = await Issue.findById(id).populate('testerId', 'name username image');
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json(issue);
    } catch (error: any) {
        console.error('Error fetching issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const issue = await Issue.findById(id);
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const isLead = session.role === ROLES.LEAD || session.role === ROLES.ADMIN;
        const isOwner = issue.testerId.toString() === session.userId;

        if (!isLead && (!isOwner || issue.status !== 'REVIEW_REQUESTED')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { status, severity, priority, leadComment, title, description, media, dynamicData } = body;

        if (isLead) {
            // Lead can update everything
            if (status) {
                issue.status = status;
                if (status === 'VALIDATED' || status === 'NA') {
                    issue.validatedAt = new Date();
                }
            }
            if (severity) issue.severity = severity;
            if (priority !== undefined) issue.priority = priority || undefined;
            if (leadComment !== undefined) issue.leadComment = leadComment;
            if (title) issue.title = title;
            if (description) issue.description = description;
            if (media) issue.media = media;
            if (dynamicData) issue.dynamicData = dynamicData;
        } else {
            // Owner can only update content and it resets status
            if (title) issue.title = title;
            if (description) issue.description = description;
            if (media) issue.media = media;
            if (dynamicData) issue.dynamicData = dynamicData;
            
            // Auto-resubmit
            issue.status = 'NOT_VALIDATED';
        }

        await issue.save();
        const updatedIssue = await Issue.findById(id).populate('testerId', 'name username image');
        return NextResponse.json(updatedIssue);
    } catch (error: any) {
        console.error('Error updating issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
