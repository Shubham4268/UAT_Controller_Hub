'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
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
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Copy, Check } from 'lucide-react';
import { generateQRCodeUrl } from '@/utils/links';

const formSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 chars'),
    description: z.string().min(1, 'Description is required'),
    scope: z.array(z.string()).min(1, 'Select at least one scope'),
    androidAppLink: z.string().url('Invalid URL').optional().or(z.literal('')),
    iosAppLink: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const SCOPE_OPTIONS = ['UI', 'Functional', 'Both'];

interface CreatedSession {
    title: string;
    iosLink: string;
    androidLink: string;
    androidAppLink?: string;
    iosAppLink?: string;
    androidQr?: string;
    iosQr?: string;
    token: string;
}

export function TestSessionModal({ onSuccess }: { onSuccess?: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            scope: [],
            androidAppLink: '',
            iosAppLink: '',
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        try {
            const res = await fetch('/api/test-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                const data = await res.json();
                setCreatedSession(data);
                if (onSuccess) onSuccess(data);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create session');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const resetAndClose = () => {
        setOpen(false);
        setCreatedSession(null);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetAndClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Test Session
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{createdSession ? 'Session Created Successfully' : 'Create New Test Session'}</DialogTitle>
                </DialogHeader>

                {!createdSession ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Test Sanity Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Weekly Sanity - Login Flow" {...field} />
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
                                        <FormLabel>Description (Scope, Notes)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detailed notes about the manual testing session..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="scope"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-2">
                                            <FormLabel>Testing Scope</FormLabel>
                                            <FormDescription>Select what applies</FormDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {SCOPE_OPTIONS.map((item) => (
                                                <FormField
                                                    key={item}
                                                    control={form.control}
                                                    name="scope"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={item}
                                                                className="flex flex-row items-center space-x-2 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, item])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== item
                                                                                    )
                                                                                );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                    {item === 'Both' ? 'Both (UI and Functional)' : item}
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="androidAppLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Android App Link (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://play.google.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="iosAppLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>iOS App Link (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://apps.apple.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Session'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{createdSession?.title}</h3>
                            <p className="text-sm text-muted-foreground">Session Token: <code className="bg-muted px-1 rounded">{createdSession?.token}</code></p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {createdSession?.iosAppLink && (
                                <div className="space-y-4 flex flex-col items-center">
                                    <p className="font-medium text-blue-600">iOS App Download</p>
                                    <div className="bg-white p-2 border rounded-xl shadow-sm">
                                        <img
                                            src={createdSession.iosQr || generateQRCodeUrl(createdSession.iosAppLink)}
                                            alt="iOS QR Code"
                                            className="w-40 h-40"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <Input readOnly value={createdSession.iosAppLink} className="text-xs" />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => copyToClipboard(createdSession.iosAppLink || '', 'ios')}
                                        >
                                            {copied === 'ios' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {createdSession?.androidAppLink && (
                                <div className="space-y-4 flex flex-col items-center">
                                    <p className="font-medium text-green-600">Android App Download</p>
                                    <div className="bg-white p-2 border rounded-xl shadow-sm">
                                        <img
                                            src={createdSession.androidQr || generateQRCodeUrl(createdSession.androidAppLink)}
                                            alt="Android QR Code"
                                            className="w-40 h-40"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <Input readOnly value={createdSession.androidAppLink} className="text-xs" />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => copyToClipboard(createdSession.androidAppLink || '', 'android')}
                                        >
                                            {copied === 'android' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!createdSession?.iosAppLink && !createdSession?.androidAppLink && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                                <p>Session created without App Download links.</p>
                                <p className="text-sm">Manage QRs from the session detail page.</p>
                            </div>
                        )}

                        <Button className="w-full" onClick={resetAndClose}>
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}
