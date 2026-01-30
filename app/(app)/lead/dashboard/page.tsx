'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TestSessionModal } from '@/components/lead/TestSessionModal';

interface Tester {
    _id: string;
    name: string;
    username: string;
    email: string;
    image?: string;
}

export default function LeadDashboard() {
    const [testers, setTesters] = useState<Tester[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTesters() {
            try {
                const res = await fetch('/api/users/testers');
                if (res.ok) {
                    const data = await res.json();
                    setTesters(data);
                }
            } catch (error) {
                console.error('Failed to fetch testers', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTesters();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Dashboard</h1>
                    <p className="text-muted-foreground">Manage your testing team and activities.</p>
                </div>
                <TestSessionModal />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Registered Testers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div>Loading...</div>
                        ) : testers.length === 0 ? (
                            <div>No testers found.</div>
                        ) : (
                            <div className="space-y-4">
                                {testers.map((tester) => (
                                    <div key={tester._id} className="flex items-center space-x-4">
                                        <Avatar>
                                            <AvatarImage src={tester.image} />
                                            <AvatarFallback>{tester.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{tester.name}</p>
                                            <p className="text-sm text-muted-foreground">@{tester.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
