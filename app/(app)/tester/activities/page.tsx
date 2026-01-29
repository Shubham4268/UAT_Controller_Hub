'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Activity {
    _id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    createdAt: string;
}

export default function TesterActivitiesPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const res = await fetch('/api/activities'); // Will return only active ones for Tester
                if (res.ok) {
                    setActivities(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Activities</h1>
                <p className="text-muted-foreground">Here are the active tasks assigned to the team.</p>
            </div>

            {loading ? (
                <div>Loading activities...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activities.map((activity) => (
                        <Card key={activity._id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="capitalize mb-2">{activity.type}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="leading-tight">{activity.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {activity.description || "No description provided."}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary">View Details</Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {activities.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No active activities found. Relax!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
