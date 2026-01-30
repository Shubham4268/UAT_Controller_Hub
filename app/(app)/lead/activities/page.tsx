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

interface TestSession {
    _id: string;
    title: string;
    description: string;
    scope: string[];
    status: 'ACTIVE' | 'STOPPED';
    createdAt: string;
}

export default function LeadActivitiesPage() {
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);
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

            socket.on('session:updated', (updatedSession: TestSession) => {
                setSessions((prev) => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
            });
        }

        return () => {
            if (socket) {
                socket.off('session-created');
                socket.off('session:updated');
            }
        };
    }, [socket]);

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
                    <CardTitle>Test Sessions</CardTitle>
                    <CardDescription>Click on a session to view submitted issues.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading sessions...</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Scope</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                No test sessions found. Start by creating one!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sessions.map((session) => (
                                            <TableRow
                                                key={session._id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/lead/activities/${session._id}`)}
                                            >
                                                <TableCell className="font-medium">
                                                    {session.title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                                                        {session.status === 'ACTIVE' ? 'Active' : 'Stopped'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {session.scope.map(s => (
                                                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/lead/activities/${session._id}`}>
                                                        <Button variant="ghost" size="sm">View Issues</Button>
                                                    </Link>
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
        </div>
    );
}
