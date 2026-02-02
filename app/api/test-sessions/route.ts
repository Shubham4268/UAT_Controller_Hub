import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongo';
import TestSession from '@/models/TestSession';
import Issue from '@/models/Issue';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';
import { generateSessionToken, constructSessionLinks, generateQRCodeUrl } from '@/utils/links';

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session || (session.role !== ROLES.LEAD && session.role !== ROLES.ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { title, description, scope, androidAppLink, iosAppLink, template } = body;

        if (!title || title.length > 100) {
            return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
        }

        const token = generateSessionToken();
        const links = constructSessionLinks(token);

        // Generate QRs if links provided
        const androidQr = androidAppLink ? generateQRCodeUrl(androidAppLink) : undefined;
        const iosQr = iosAppLink ? generateQRCodeUrl(iosAppLink) : undefined;

        const testSession = await TestSession.create({
            title,
            description,
            scope,
            iosLink: links.ios,
            androidLink: links.android,
            androidAppLink,
            iosAppLink,
            androidQr,
            iosQr,
            token,
            template, // Save the full template definition
            createdBy: session.userId,
        });

        return NextResponse.json(testSession, { status: 201 });
    } catch (error: any) {
        console.error('Error creating test session:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Both Leads and Testers should see all sessions in this centralized board
        const query = {};
        const sessions = await TestSession.find(query).sort({ createdAt: -1 }).lean();

        // Enriched sessions with issue stats for Lead dashboard
        const enrichedSessions = await Promise.all(sessions.map(async (s: any) => {
            const [totalIssues, pendingIssues, uniqueTesters] = await Promise.all([
                Issue.countDocuments({ sessionId: s._id }),
                Issue.countDocuments({ sessionId: s._id, status: { $nin: ['VALIDATED', 'NA'] } }),
                Issue.distinct('testerId', { sessionId: s._id })
            ]);

            return {
                ...s,
                issueStats: {
                    total: totalIssues,
                    pending: pendingIssues,
                    isEligible: totalIssues > 0 && pendingIssues === 0,
                    testerCount: uniqueTesters.length
                }
            };
        }));

        return NextResponse.json(enrichedSessions);
    } catch (error: any) {
        console.error('Error fetching test sessions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// I should have put this in [id]/route.ts but adding here if I can't create multiple files easily
// Actually I'll create the file properly if possible.
