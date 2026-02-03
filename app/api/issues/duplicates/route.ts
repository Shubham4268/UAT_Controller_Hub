import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';
import { detectDuplicates } from '@/lib/utils/deduplication';

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const issueId = searchParams.get('issueId');

        if (!issueId) {
            return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
        }

        await connectDB();

        const currentIssue = await Issue.findById(issueId);
        if (!currentIssue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Get all issues from the same session created BEFORE this issue
        const previousIssues = await Issue.find({
            sessionId: currentIssue.sessionId,
            createdAt: { $lt: currentIssue.createdAt },
            testerId: { $ne: currentIssue.testerId } // Exclude current tester's own issues as per requirement
        }).sort({ createdAt: 1 });

        const result = detectDuplicates(currentIssue, previousIssues);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error detecting duplicates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
