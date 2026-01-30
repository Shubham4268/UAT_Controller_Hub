'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IssueSubmissionForm } from '@/components/tester/IssueSubmissionForm';
import { IssueTable } from '@/components/common/IssueTable';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';

interface Activity {
    _id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    metadata?: Record<string, any>;
}

export default function TesterActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any | null>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        async function fetchData() {
            try {
                const [sessionRes, issuesRes] = await Promise.all([
                    fetch(`/api/test-sessions/${id}`),
                    fetch(`/api/issues?sessionId=${id}`),
                ]);

                if (sessionRes.ok) setSession(await sessionRes.json());
                if (issuesRes.ok) setIssues(await issuesRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        if (socket) {
            socket.emit('join-activity', id);

            socket.on('issue:refreshed', (updatedIssue: any) => {
                setIssues((prev) =>
                    prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
                );
            });

            socket.on('issue:new', (newIssue: any) => {
                setIssues((prev) => [newIssue, ...prev]);
            });
        }

        return () => {
            if (socket) {
                socket.off('issue:refreshed');
                socket.off('issue:new');
            }
        };
    }, [id, socket]);

    if (loading) return <div>Loading details...</div>;
    if (!session) return <div>Session not found.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                    </div>
                    <p className="text-muted-foreground capitalize">Test Session - Reporter View</p>
                </div>
                <IssueSubmissionForm
                    sessionId={id}
                    onSuccess={(newIssue) => {
                        setIssues((prev) => [newIssue, ...prev]);
                    }}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Description</CardTitle>
                    <CardDescription>Details provided by your Lead.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap">{session.description || "No description provided."}</p>
                    <div className="flex gap-2">
                        {session.scope?.map((s: string) => (
                            <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <AppQrSection
                androidAppLink={session.androidAppLink}
                iosAppLink={session.iosAppLink}
                androidQr={session.androidQr}
                iosQr={session.iosQr}
            />

            <div className="space-y-4">
                <h2 className="text-xl font-bold">My Reported Issues</h2>
                <IssueTable issues={issues} mode="tester" showComment={true} />
            </div>
        </div>
    );
}
