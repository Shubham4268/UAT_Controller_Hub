'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/components/providers/SocketProvider';
import Link from 'next/link';

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
        testerCount: number;
    };
}

export default function TesterActivitiesPage() {
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        async function fetchSessions() {
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
        }
        fetchSessions();

        if (socket) {
            socket.on('session:updated', (updatedSession: TestSession) => {
                setSessions((prev) => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
            });
        }

        return () => {
            if (socket) socket.off('session:updated');
        };
    }, [socket]);

    const activeSessions = sessions.filter(s => s.completionStatus !== 'COMPLETED');
    const completedSessions = sessions.filter(s => s.completionStatus === 'COMPLETED');

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Active sessions</h1>
                <p className="text-muted-foreground">Select a session to start reporting issues.</p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl border bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeSessions.map((session) => (
                            <Card key={session._id} className="flex flex-col border-2 hover:border-primary/20 transition-all">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] h-5">
                                                {session.status === 'ACTIVE' ? '● Active' : '● Stopped'}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 font-normal">
                                                {session.issueStats?.total || 0} Issues
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 font-normal">
                                                {session.issueStats?.testerCount || 0} Testers
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="leading-tight text-xl mt-2">{session.title}</CardTitle>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(session.scope === 'Both' ? ['UI', 'Functional'] : [session.scope]).map(s => (
                                            <Badge key={s} variant="outline" className="text-[9px] font-normal">{s}</Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {session.description || "No description provided."}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/tester/activities/${session._id}`} className="w-full">
                                        <Button className="w-full" variant="default">Open Dashboard</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {activeSessions.length === 0 && (
                        <div className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <CardTitle className="text-muted-foreground mb-4">No active sessions found</CardTitle>
                            <p>All sessions are currently completed or none have been created yet.</p>
                        </div>
                    )}

                    {completedSessions.length > 0 && (
                        <div className="space-y-6 pt-8 border-t">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Completed sessions</h2>
                                <p className="text-muted-foreground">View history of finalized test sessions.</p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                                {completedSessions.map((session) => (
                                    <Card key={session._id} className="flex flex-col border bg-muted/30">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">
                                                        Completed
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] h-5 bg-muted/20 font-normal">
                                                        {session.issueStats?.total || 0} Issues
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] h-5 bg-muted/20 font-normal">
                                                        {session.issueStats?.testerCount || 0} Testers
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <CardTitle className="leading-tight text-xl mt-2">{session.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {session.description}
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <Link href={`/tester/activities/${session._id}`} className="w-full">
                                                <Button className="w-full" variant="ghost">View History</Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
