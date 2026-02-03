import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';
import { detectDuplicates, DuplicateCheckResult } from '@/lib/utils/deduplication';

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // Get all issues for this session, sorted by creation time
        const allIssues = await Issue.find({ sessionId })
            .populate('testerId', 'name username image')
            .sort({ createdAt: 1 })
            .lean();

        // Filter to get only current tester's NOT_VALIDATED issues
        const testerIssues = allIssues.filter(
            (issue: any) => 
                issue.testerId._id.toString() === session.userId &&
                issue.status === 'NOT_VALIDATED'
        );

        if (testerIssues.length === 0) {
            return NextResponse.json({ 
                message: 'No pending issues to review',
                issues: []
            });
        }

        // For each tester issue, check for duplicates with earlier issues from other testers
        const issuesWithDuplicateCheck = testerIssues.map((issue: any) => {
            // Get all issues created before this one, excluding tester's own issues
            const previousIssues = allIssues.filter((other: any) => 
                new Date(other.createdAt) < new Date(issue.createdAt) &&
                other.testerId._id.toString() !== session.userId
            );

            const duplicateResult: DuplicateCheckResult = detectDuplicates(issue, previousIssues);

            return {
                ...issue,
                duplicateCheck: {
                    isDuplicate: duplicateResult.isDuplicate,
                    matches: duplicateResult.matches.map(match => ({
                        issue: match.issue,
                        score: match.score,
                        reasons: match.reasons
                    })),
                    confidenceScore: duplicateResult.confidenceScore
                }
            };
        });

        return NextResponse.json({
            issues: issuesWithDuplicateCheck,
            totalCount: issuesWithDuplicateCheck.length
        });

    } catch (error: any) {
        console.error('Error in AI review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
