'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IssueTable } from '@/components/common/IssueTable';
import { ValidationModal } from '@/components/lead/ValidationModal';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';
import { CompletionConfirmModal } from '@/components/lead/CompletionConfirmModal';
import { Play, Square, Loader2, CheckCircle2 } from 'lucide-react';

interface Activity {
    _id: string;
    title: string;
    description: string;
    scope: string;
    status: string;
}

export default function LeadActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any | null>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
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
            socket.emit('join:session', id);

            socket.on('issue:created', (newIssue: any) => {
                setIssues((prev) => {
                    // Prevent duplicates
                    if (prev.some(iss => iss._id === newIssue._id)) return prev;
                    return [...prev, newIssue];
                });
            });

            socket.on('issue:refreshed', (updatedIssue: any) => {
                setIssues((prev) =>
                    prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
                );
            });

            socket.on('session:data-updated', (updatedSession: any) => {
                if (updatedSession._id === id) {
                    setSession(updatedSession);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('issue:created');
                socket.off('issue:refreshed');
                socket.off('session:data-updated');
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

    const handleToggleSession = async () => {
        if (!session) return;
        setToggling(true);
        const newStatus = session.status === 'ACTIVE' ? 'STOPPED' : 'ACTIVE';
        try {
            const res = await fetch(`/api/test-sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                const updated = await res.json();
                setSession(updated);
                if (socket) {
                    socket.emit(newStatus === 'ACTIVE' ? 'session:started' : 'session:stopped', updated);
                    socket.emit('session:updated', updated);
                }
            }
        } catch (error) {
            console.error('Failed to toggle session', error);
        } finally {
            setToggling(false);
        }
    };

    const handleCompleteSession = async () => {
        if (!session) return;
        setToggling(true);
        try {
            const res = await fetch(`/api/test-sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completionStatus: 'COMPLETED' }),
            });

            if (res.ok) {
                const updated = await res.json();
                setSession(updated);
                if (socket) {
                    socket.emit('session:completed', updated);
                    socket.emit('session:updated', updated);
                }
            }
        } catch (error) {
            console.error('Failed to complete session', error);
        } finally {
            setToggling(false);
        }
    };

    const pendingIssues = issues.filter(iss => iss.status !== 'VALIDATED' && iss.status !== 'NA');
    const validatedIssues = issues.filter(iss => iss.status === 'VALIDATED' || iss.status === 'NA');

    if (loading) return <div>Loading session details...</div>;
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
                    <p className="text-muted-foreground italic text-sm">
                        {session.completionStatus === 'COMPLETED'
                            ? `Completed on ${new Date(session.completedAt).toLocaleDateString()} at ${new Date(session.completedAt).toLocaleTimeString()}`
                            : session.status === 'ACTIVE'
                                ? `Started at ${new Date(session.startedAt).toLocaleTimeString()}`
                                : 'This session is currently stopped.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {session.completionStatus !== 'COMPLETED' && (
                        <>
                            {pendingIssues.length === 0 && issues.length > 0 && (
                                <Button
                                    onClick={() => setIsCompleteModalOpen(true)}
                                    disabled={toggling}
                                    variant="outline"
                                    className="border-green-600 text-green-600 hover:bg-green-50 gap-2 px-6"
                                >
                                    {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Mark as Completed
                                </Button>
                            )}

                            {session.status === 'STOPPED' ? (
                                <Button
                                    onClick={handleToggleSession}
                                    disabled={toggling}
                                    className="bg-green-600 hover:bg-green-700 gap-2 px-6"
                                >
                                    {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                    Start Session
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleToggleSession}
                                    variant="destructive"
                                    disabled={toggling}
                                    className="gap-2 px-6"
                                >
                                    {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 fill-current" />}
                                    Stop Session
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                    <CardDescription>{session.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Badge variant="outline">
                            {session.scope === 'Both' ? 'Both (UI and Functional)' : session.scope}
                        </Badge>
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

            <CompletionConfirmModal
                open={isCompleteModalOpen}
                onOpenChange={setIsCompleteModalOpen}
                onConfirm={handleCompleteSession}
                loading={toggling}
            />
        </div>
    );
}
