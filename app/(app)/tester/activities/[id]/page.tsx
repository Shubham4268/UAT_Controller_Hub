'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IssueSubmissionForm } from '@/components/tester/IssueSubmissionForm';
import { IssueTable } from '@/components/common/IssueTable';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';
import { AlertCircle, PlayCircle, StopCircle, CheckCircle2, User, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../../../components/ui/alert';

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
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const currentUserId = user?.userId;

    useEffect(() => {
        async function fetchData() {
            try {
                const [sessionRes, issuesRes, userRes] = await Promise.all([
                    fetch(`/api/test-sessions/${id}`),
                    fetch(`/api/issues?sessionId=${id}`),
                    fetch('/api/auth/me'),
                ]);

                if (sessionRes.ok) setSession(await sessionRes.json());
                if (issuesRes.ok) setIssues(await issuesRes.json());
                if (userRes.ok) setUser(await userRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        if (socket) {
            socket.emit('join:session', id);

            socket.on('issue:refreshed', (updatedIssue: any) => {
                setIssues((prev) =>
                    prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
                );
            });

            socket.on('issue:created', (newIssue: any) => {
                setIssues((prev) => {
                    if (prev.some(iss => iss._id === newIssue._id)) return prev;
                    return [...prev, newIssue];
                });
            });

            socket.on('session:data-updated', (updatedSession: any) => {
                if (updatedSession._id === id) {
                    setSession(updatedSession);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('issue:refreshed');
                socket.off('issue:created');
                socket.off('session:data-updated');
            }
        };
    }, [id, socket]);

    if (loading) return <div>Loading details...</div>;
    if (!session) return <div>Session not found.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                        <div className="flex gap-2">
                            <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="h-6">
                                {session.status === 'ACTIVE' ? '● Active' : '● Stopped'}
                            </Badge>
                            {session.completionStatus === 'COMPLETED' && (
                                <Badge variant="outline" className="h-6 bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Completed
                                </Badge>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground capitalize text-sm">Test Session - Reporter View</p>
                </div>
                {session.completionStatus === 'COMPLETED' ? (
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 border-dashed">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Session Completed</span>
                    </div>
                ) : session.status === 'ACTIVE' ? (
                    <IssueSubmissionForm
                        sessionId={id}
                        onSuccess={(newIssue) => {
                            setIssues((prev) => {
                                if (prev.some(iss => iss._id === newIssue._id)) return prev;
                                return [...prev, newIssue];
                            });
                        }}
                    />
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border border-dashed">
                        <StopCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Submission Disabled</span>
                    </div>
                )}
            </div>

            {session.completionStatus === 'COMPLETED' ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Session Successfully Completed</AlertTitle>
                    <AlertDescription>
                        This session has been marked as completed by the Lead. No further issues can be reported.
                    </AlertDescription>
                </Alert>
            ) : session.status === 'STOPPED' && (
                <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Session Stopped</AlertTitle>
                    <AlertDescription>
                        This test session is currently stopped. Issue submission is disabled.
                    </AlertDescription>
                </Alert>
            )}

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

            <div className="space-y-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold text-primary">My Reported Issues</h2>
                    </div>
                    <IssueTable
                        issues={issues.filter(iss => (iss.testerId?._id || iss.testerId) === currentUserId)}
                        mode="tester"
                        showComment={true}
                    />
                </div>

                <div className="space-y-4 pt-8 border-t">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-bold">Other Testers' Issues</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Context from peer-reported issues (view-only).</p>
                    <IssueTable
                        issues={issues.filter(iss => (iss.testerId?._id || iss.testerId) !== currentUserId)}
                        mode="tester"
                        showComment={true}
                        showTesterName={true}
                    />
                </div>
            </div>
        </div>
    );
}
