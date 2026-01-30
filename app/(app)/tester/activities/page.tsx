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
    scope: string[];
    status: 'ACTIVE' | 'STOPPED';
    createdAt: string;
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Active Test Sessions</h1>
                <p className="text-muted-foreground">Select a session to start reporting issues.</p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl border bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => (
                        <Card key={session._id} className="flex flex-col border-2 hover:border-primary/20 transition-all">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] h-5">
                                        {session.status === 'ACTIVE' ? '● Active' : '● Stopped'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(session.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="leading-tight text-xl">{session.title}</CardTitle>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {session.scope?.map(s => (
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

                    {sessions.length === 0 && (
                        <div className="col-span-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <CardTitle className="text-muted-foreground">No sessions yet</CardTitle>
                            </div>
                            <p>Contact your Lead to start a new testing session.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
