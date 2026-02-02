import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthUser();
        if (!session || (session.role !== ROLES.LEAD && session.role !== ROLES.ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { status, severity, priority, leadComment, title, description } = body;

        const issue = await Issue.findById(id);
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Auto-assign status based on action
        if (status) {
            issue.status = status;
            issue.validatedAt = new Date();
        }

        if (severity) issue.severity = severity;
        if (priority !== undefined) issue.priority = priority || undefined;
        if (leadComment !== undefined) issue.leadComment = leadComment;

        // Optionally allow updating title/description if Lead needs to clarify
        if (title) issue.title = title;
        if (description) issue.description = description;

        await issue.save();

        const updatedIssue = await Issue.findById(id).populate('testerId', 'name username image');

        return NextResponse.json(updatedIssue);
    } catch (error: any) {
        console.error('Error updating issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
