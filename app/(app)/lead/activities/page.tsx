'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TestSessionModal } from '@/components/lead/TestSessionModal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/components/providers/SocketProvider';
import { CompletionConfirmModal } from '@/components/lead/CompletionConfirmModal';
import { CheckCircle2, Eye, ExternalLink } from 'lucide-react';

interface TestSession {
    _id: string;
    title: string;
    description: string;
    scope: string;
    status: 'ACTIVE' | 'STOPPED';
    completionStatus: 'ACTIVE' | 'COMPLETED';
    createdAt: string;
    issueStats?: {
        total: number;
        pending: number;
        isEligible: boolean;
        testerCount: number;
    };
}

export default function LeadActivitiesPage() {
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingSession, setConfirmingSession] = useState<TestSession | null>(null);
    const [completing, setCompleting] = useState(false);
    const { socket } = useSocket();
    const router = useRouter();
    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/test-sessions');
            if (res.ok) {
                setSessions(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();

        if (socket) {
            socket.on('session-created', (newSession: TestSession) => {
                setSessions((prev) => [newSession, ...prev]);
            });

            socket.on('session:updated', (updatedSession: any) => {
                setSessions((prev) => prev.map(s => s._id === updatedSession._id ? { ...s, ...updatedSession } : s));
            });

            socket.on('session:completed', (completedSession: any) => {
                setSessions((prev) => prev.map(s => s._id === completedSession._id ? { ...s, ...completedSession } : s));
            });
        }

        return () => {
            if (socket) {
                socket.off('session-created');
                socket.off('session:updated');
                socket.off('session:completed');
            }
        };
    }, [socket]);

    const handleCompleteSession = async () => {
        if (!confirmingSession) return;
        setCompleting(true);
        try {
            const res = await fetch(`/api/test-sessions/${confirmingSession._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completionStatus: 'COMPLETED' }),
            });

            if (res.ok) {
                const updated = await res.json();
                setSessions((prev) => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
                if (socket) {
                    socket.emit('session:completed', updated);
                    socket.emit('session:updated', updated);
                }
                setConfirmingSession(null);
            }
        } catch (error) {
            console.error('Failed to complete session', error);
        } finally {
            setCompleting(false);
        }
    };

    const handleStatusChange = async (session: TestSession, newStatus: 'ACTIVE' | 'STOPPED') => {
        try {
            const res = await fetch(`/api/test-sessions/${session._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                const updated = await res.json();
                setSessions((prev) => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
                if (socket) {
                    socket.emit('session:updated', updated);
                }
            }
        } catch (error) {
            console.error('Failed to update session status', error);
        }
    };

    const activeSessions = sessions.filter(s => s.completionStatus !== 'COMPLETED');
    const completedSessions = sessions.filter(s => s.completionStatus === 'COMPLETED');

    const SessionCard = ({ session, readonly = false }: { session: TestSession; readonly?: boolean }) => (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <CardTitle className="leading-tight">{session.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{session.scope}</CardDescription>
                    </div>
                    <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="shrink-0">
                        {session.status === 'ACTIVE' ? 'Active' : 'Stopped'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Created</span>
                        <p className="font-medium">{new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Issues</span>
                        <p className="font-medium">{session.issueStats?.total || 0}</p>
                    </div>
                </div>

            </CardContent>
            <div className="p-6 pt-0 mt-auto flex flex-wrap gap-2">
                {!readonly && (
                    <>
                        {session.status === 'STOPPED' ? (
                            <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStatusChange(session, 'ACTIVE')}
                            >
                                Start Session
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleStatusChange(session, 'STOPPED')}
                            >
                                Stop Session
                            </Button>
                        )}

                        {session.issueStats?.isEligible && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 hover:bg-green-50 text-green-700 w-full"
                                onClick={() => setConfirmingSession(session)}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Mark Completed
                            </Button>
                        )}
                    </>
                )}

                <Button
                    size="sm"
                    variant={readonly ? "secondary" : "outline"}
                    className="w-full"
                    onClick={() => router.push(`/lead/activities/${session._id}`)}
                >
                    {readonly ? <Eye className="h-3.5 w-3.5 mr-2" /> : <ExternalLink className="h-3.5 w-3.5 mr-2" />}
                    {readonly ? 'View Details' : 'Open Session'}
                </Button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Activities</h1>
                    <p className="text-muted-foreground">Create and monitor test sessions and issues.</p>
                </div>
                <TestSessionModal onSuccess={(newSession) => {
                    fetchSessions();
                    if (socket) socket.emit('new-session', newSession);
                }} />
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <h2 className="text-lg font-semibold tracking-tight">Active Sessions</h2>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
                ) : activeSessions.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                        <p className="text-muted-foreground">No active sessions found.</p>
                        <Button variant="link" className="mt-2">Create your first session</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeSessions.map(session => (
                            <SessionCard key={session._id} session={session} />
                        ))}
                    </div>
                )}
            </div>

            {completedSessions.length > 0 && (
                <div className="space-y-6 pt-4 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5" />
                        <h2 className="text-lg font-semibold tracking-tight">Completed History</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                        {completedSessions.map(session => (
                            <SessionCard key={session._id} session={session} readonly />
                        ))}
                    </div>
                </div>
            )}

            <CompletionConfirmModal
                open={!!confirmingSession}
                onOpenChange={(open) => !open && setConfirmingSession(null)}
                onConfirm={handleCompleteSession}
                loading={completing}
            />
        </div>
    );
}
