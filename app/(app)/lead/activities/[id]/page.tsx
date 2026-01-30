'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IssueTable } from '@/components/common/IssueTable';
import { ValidationModal } from '@/components/lead/ValidationModal';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';

interface Activity {
    _id: string;
    title: string;
    description: string;
    type: string;
    status: string;
}

export default function LeadActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any | null>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
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

            socket.on('issue:new', (newIssue: any) => {
                setIssues((prev) => [newIssue, ...prev]);
            });

            socket.on('issue-refreshed', (updatedIssue: any) => {
                setIssues((prev) =>
                    prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
                );
            });
        }

        return () => {
            if (socket) {
                socket.off('issue:new');
                socket.off('issue:refreshed');
            }
        };
    }, [id, socket]);

    const handleValidate = (issue: any) => {
        setSelectedIssue(issue);
        setIsValidationOpen(true);
    };

    const onValidationSuccess = (updatedIssue: any) => {
        setIssues((prev) =>
            prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
        );
        if (socket) {
            socket.emit('issue:validated', { ...updatedIssue, sessionId: id });
        }
    };

    const pendingIssues = issues.filter(iss => iss.status !== 'VALIDATED' && iss.status !== 'NA');
    const validatedIssues = issues.filter(iss => iss.status === 'VALIDATED' || iss.status === 'NA');

    if (loading) return <div>Loading session details...</div>;
    if (!session) return <div>Session not found.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                    </div>
                    <p className="text-muted-foreground">Session monitoring and validation dashboard.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                    <CardDescription>{session.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {session.scope.map((s: string) => (
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

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">🧾 Issues To Be Validated</h2>
                        <Badge variant="outline">{pendingIssues.length} Pending</Badge>
                    </div>
                    <IssueTable
                        issues={pendingIssues}
                        mode="lead"
                        onValidate={handleValidate}
                        hideStatus={true}
                        showComment={true}
                        actionLabel="Validate"
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">✅ Validated / NA Issues</h2>
                        <Badge variant="outline">{validatedIssues.length} Completed</Badge>
                    </div>
                    <IssueTable
                        issues={validatedIssues}
                        mode="lead"
                        onValidate={handleValidate}
                        hideStatus={true}
                        showComment={true}
                        actionLabel="Revalidate"
                    />
                </div>
            </div>

            <ValidationModal
                issue={selectedIssue}
                open={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                onSuccess={onValidationSuccess}
            />
        </div>
    );
}
