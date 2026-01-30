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
    scope: string[];
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

    const activeSessions = sessions.filter(s => s.completionStatus !== 'COMPLETED');
    const completedSessions = sessions.filter(s => s.completionStatus === 'COMPLETED');

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

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <CardTitle>Active Sessions</CardTitle>
                    </div>
                    <CardDescription>Manage currently running test activities.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading sessions...</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">S.No</TableHead>
                                        <TableHead>Session Name</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Start/Stop State</TableHead>
                                        <TableHead>Issue Count</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeSessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                No active sessions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeSessions.map((session, index) => (
                                            <TableRow key={session._id} className="group">
                                                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {session.title}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                                                        {session.status === 'ACTIVE' ? 'Active' : 'Stopped'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {session.issueStats?.total || 0} Issues
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {session.issueStats?.isEligible && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 border-green-200 hover:bg-green-50 h-8 gap-1 px-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmingSession(session);
                                                                }}
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Mark as Completed
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8 gap-1"
                                                            onClick={() => router.push(`/lead/activities/${session._id}`)}
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            Open Session
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="opacity-80">
                <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-muted-foreground">Completed Sessions</CardTitle>
                    </div>
                    <CardDescription>View-only history of finalized test sessions.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-md border bg-muted/10">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">S.No</TableHead>
                                    <TableHead>Session Name</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Issue Count</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completedSessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No completed sessions yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    completedSessions.map((session, index) => (
                                        <TableRow key={session._id}>
                                            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                {session.title}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal opacity-70">
                                                    {session.issueStats?.total || 0} Issues
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 gap-1"
                                                    onClick={() => router.push(`/lead/activities/${session._id}`)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Only
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <CompletionConfirmModal
                open={!!confirmingSession}
                onOpenChange={(open) => !open && setConfirmingSession(null)}
                onConfirm={handleCompleteSession}
                loading={completing}
            />
        </div>
    );
}
