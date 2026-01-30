'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    deviceDetails: z.string().min(1, 'Device details (e.g. iPhone 13) are required'),
    osVersion: z.string().min(1, 'OS version (e.g. iOS 17.2) is required'),
    media: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IssueSubmissionFormProps {
    sessionId: string;
    onSuccess?: (newIssue: any) => void;
}

export function IssueSubmissionForm({ sessionId, onSuccess }: IssueSubmissionFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            deviceDetails: '',
            osVersion: '',
            media: '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        try {
            const res = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, sessionId }),
            });

            if (res.ok) {
                const newIssue = await res.json();

                // Emit socket event for real-time update
                if (socket) {
                    socket.emit('issue:submitted', { ...newIssue, sessionId });
                }

                if (onSuccess) onSuccess(newIssue);
                form.reset();
                setOpen(false);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to submit issue');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Issue
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Report New Issue</DialogTitle>
                    <DialogDescription>
                        Provide clear details and optional media to help the team resolve the issue.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Issue Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brief title of the issue" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detailed steps to reproduce or description..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="deviceDetails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Details</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. iPhone 15 Pro" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="osVersion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>OS Version</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. iOS 17.4" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="media"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Media URL (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Image or Video URL" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Issue'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
