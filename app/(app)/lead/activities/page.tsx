'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Activity {
    _id: string;
    title: string;
    type: string;
    status: string;
}

export default function LeadActivitiesPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('task');

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/activities');
            if (res.ok) {
                setActivities(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, type }),
            });

            if (res.ok) {
                setTitle('');
                setDescription('');
                setType('task');
                fetchActivities(); // Refresh list
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Activities</h1>
                <p className="text-muted-foreground">Create and monitor test activities.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Create Activity Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Activity</CardTitle>
                        <CardDescription>Define a new task or milestone for testers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Test Login Flow"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="task">Task</SelectItem>
                                        <SelectItem value="milestone">Milestone</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Details about the activity..."
                                />
                            </div>

                            <Button type="submit">Create Activity</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <ul className="space-y-4">
                                {activities.map((activity) => (
                                    <li key={activity._id} className="border p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold">{activity.title}</h4>
                                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="bg-secondary px-2 py-0.5 rounded capitalize">{activity.type}</span>
                                                <span className="bg-secondary px-2 py-0.5 rounded capitalize">{activity.status}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {activities.length === 0 && <p className="text-muted-foreground">No activities found.</p>}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
