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
        const { issueId, action, mediaUrl, duplicateCheckData } = body;

        // Validate required fields
        if (!issueId || !action) {
            return NextResponse.json({ 
                error: 'Issue ID and action are required' 
            }, { status: 400 });
        }

        if (!['proceed', 'mark-na'].includes(action)) {
            return NextResponse.json({ 
                error: 'Invalid action. Must be "proceed" or "mark-na"' 
            }, { status: 400 });
        }

        // For 'proceed' action, media is mandatory
        if (action === 'proceed' && !mediaUrl) {
            return NextResponse.json({ 
                error: 'Media URL is required when proceeding with an issue' 
            }, { status: 400 });
        }

        // Find the issue
        const issue = await Issue.findById(issueId);
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Verify ownership
        if (issue.testerId.toString() !== session.userId) {
            return NextResponse.json({ 
                error: 'You can only review your own issues' 
            }, { status: 403 });
        }

        // Verify issue is in correct state
        if (issue.status !== 'NOT_VALIDATED') {
            return NextResponse.json({ 
                error: 'Issue has already been reviewed or validated' 
            }, { status: 400 });
        }

        // Update issue based on action
        if (action === 'proceed') {
            issue.media = mediaUrl;
            issue.status = 'REVIEWED';
            issue.aiReviewedAt = new Date();
            issue.aiReviewData = {
                duplicateCheckPerformed: true,
                matchedIssues: duplicateCheckData?.matchedIssues || [],
                confidenceScore: duplicateCheckData?.confidenceScore || 0
            };
        } else if (action === 'mark-na') {
            issue.status = 'NA';
            issue.aiReviewedAt = new Date();
            issue.aiReviewData = {
                duplicateCheckPerformed: true,
                matchedIssues: duplicateCheckData?.matchedIssues || [],
                confidenceScore: duplicateCheckData?.confidenceScore || 0
            };
        }

        await issue.save();

        // Populate and return updated issue
        const updatedIssue = await Issue.findById(issueId)
            .populate('testerId', 'name username image');

        return NextResponse.json({
            success: true,
            issue: updatedIssue
        });

    } catch (error: any) {
        console.error('Error submitting AI review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
