'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Users, Activity, CheckCircle2, LayoutDashboard } from 'lucide-react';

interface Tester {
    _id: string;
    name: string;
    username: string;
    email: string;
    image?: string;
    role: string;
    devices?: Array<{ name: string; os: string }>;
}

export default function LeadDashboard() {
    const [testers, setTesters] = useState<Tester[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [testersRes, sessionsRes] = await Promise.all([
                    fetch('/api/users/testers'),
                    fetch('/api/test-sessions')
                ]);

                if (testersRes.ok) setTesters(await testersRes.json());
                if (sessionsRes.ok) setSessions(await sessionsRes.json());
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const activeSessions = sessions.filter(s => s.status === 'ACTIVE' && s.completionStatus !== 'COMPLETED').length;
    const completedSessions = sessions.filter(s => s.completionStatus === 'COMPLETED').length;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your testing operations and team.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
  {/* Active Sessions */}
  <Card className="border border-border bg-card shadow-sm transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-foreground">
        Active Sessions
      </CardTitle>
      <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    </CardHeader>

    <CardContent>
      <div className="text-3xl font-bold text-foreground">
        {loading ? "-" : activeSessions}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Currently running
      </p>
    </CardContent>
  </Card>

  {/* Completed Sessions */}
  <Card className="border border-border bg-card shadow-sm transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-foreground">
        Completed Sessions
      </CardTitle>
      <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
    </CardHeader>

    <CardContent>
      <div className="text-3xl font-bold text-foreground">
        {loading ? "-" : completedSessions}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Successfully finished
      </p>
    </CardContent>
  </Card>

  {/* Team Members */}
  <Card className="border border-border bg-card shadow-sm transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-foreground">
        Team Members
      </CardTitle>
      <Users className="h-4 w-4 text-primary" />
    </CardHeader>

    <CardContent>
      <div className="text-3xl font-bold text-foreground">
        {loading ? "-" : testers.length}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Testers & Leads
      </p>
    </CardContent>
  </Card>
</div>


            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Team Members
                    </CardTitle>
                    <CardDescription>
                        Details of all leads and testers in your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">Loading team data...</div>
                    ) : testers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No team members found.</div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {testers.map((tester) => (
                                <div key={tester._id} className="flex flex-col gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                <AvatarImage src={tester.image} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {tester.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-0.5">
                                                <p className="font-semibold leading-none group-hover:text-primary transition-colors">{tester.name}</p>
                                                <p className="text-xs text-muted-foreground">@{tester.username}</p>
                                            </div>
                                        </div>
                                        <Badge variant={tester.role === 'lead' ? 'default' : 'secondary'} className="capitalize shadow-sm">
                                            {tester.role}
                                        </Badge>
                                    </div>

                                    <div className="mt-auto pt-3 border-t flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Smartphone className="h-3.5 w-3.5" />
                                            <span>
                                                {tester.devices?.length || 0} Devices
                                            </span>
                                        </div>
                                        {tester.devices && tester.devices.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {tester.devices.slice(0, 3).map((d, i) => (
                                                    <span key={i} className="inline-flex px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground border">
                                                        {d.name}
                                                    </span>
                                                ))}
                                                {tester.devices.length > 3 && (
                                                    <span className="inline-flex px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground border">
                                                        +{tester.devices.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic pl-5">
                                                No devices added
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
