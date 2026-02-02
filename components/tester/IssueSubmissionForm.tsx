'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';
import { IssueTemplate, TemplateField } from '@/config/templates';

interface IssueSubmissionFormProps {
    sessionId: string;
    template?: IssueTemplate;
    onSuccess?: (newIssue: any) => void;
}

const CORE_FIELDS = ['title', 'description', 'media', 'deviceDetails', 'osVersion', 'severity'];

export function IssueSubmissionForm({ sessionId, template, onSuccess }: IssueSubmissionFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();

    // Generate schema based on template or use default
    const formSchema = useMemo(() => {
        if (!template) {
            return z.object({
                title: z.string().min(1, 'Title is required'),
                description: z.string().min(1, 'Description is required'),
                deviceDetails: z.string().min(1, 'Device details required'),
                osVersion: z.string().min(1, 'OS version required'),
                media: z.string().optional(),
            });
        }

        const shape: any = {};
        template.fields.forEach((field) => {
            let validator: z.ZodTypeAny = z.string();
            if (field.type === 'url') {
                validator = z.string().url('Invalid URL').optional().or(z.literal(''));
            } else if (!field.required) {
                validator = z.string().optional();
            } else {
                validator = z.string().min(1, `${field.label} is required`);
            }
            shape[field.key] = validator;
        });
        return z.object(shape);
    }, [template]);

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {},
    });

    // Reset default values when template changes or modal opens
    useEffect(() => {
        if (open) {
            const defaults: any = {};
            if (template) {
                template.fields.forEach(f => defaults[f.key] = '');
            } else {
                defaults.title = '';
                defaults.description = '';
                defaults.deviceDetails = '';
                defaults.osVersion = '';
                defaults.media = '';
            }
            form.reset(defaults);
        }
    }, [open, template, form]);

    async function onSubmit(values: any) {
        setLoading(true);
        try {
            // Separate core fields from dynamic data
            const payload: any = { sessionId };
            const dynamicData: any = {};

            Object.keys(values).forEach(key => {
                if (CORE_FIELDS.includes(key)) {
                    payload[key] = values[key];
                } else {
                    dynamicData[key] = values[key];
                }
            });

            if (Object.keys(dynamicData).length > 0) {
                payload.dynamicData = dynamicData;
            }

            const res = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const newIssue = await res.json();
                if (socket) {
                    socket.emit('issue:submitted', { ...newIssue, sessionId });
                }
                if (onSuccess) onSuccess(newIssue);
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

    const renderFieldInput = (field: TemplateField, formField: any) => {
        switch (field.type) {
            case 'textarea':
                return <Textarea placeholder={field.placeholder} className="min-h-[100px]" {...formField} />;
            case 'select':
                return (
                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || "Select option"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'checkbox':
                // Checkbox usually boolean, but keeping string simplicity for now or adapting
                 // Actually for consistency with string schema, let's treat it as a boolean-ish string or handle boolean schema
                 // simplifying to text input for now if complicated, but let's try checkbox
                 return (
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            checked={formField.value === 'true'} 
                            onCheckedChange={(checked) => formField.onChange(checked ? 'true' : 'false')} 
                        />
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                    </div>
                 )
            default:
                return <Input placeholder={field.placeholder} {...formField} />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Issue
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Report New Issue</DialogTitle>
                    <DialogDescription>
                        {template ? `Using template: ${template.name}` : 'Provide clear details to help the team resolve the issue.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {template ? (
                            template.fields.map((field) => (
                                <FormField
                                    key={field.key}
                                    control={form.control}
                                    name={field.key}
                                    render={({ field: formField }) => (
                                        <FormItem className={field.type === 'checkbox' ? 'flex flex-row items-center space-x-3 space-y-0 p-2' : ''}>
                                            {field.type !== 'checkbox' && <FormLabel>{field.label}</FormLabel>}
                                            <FormControl>
                                                {renderFieldInput(field, formField)}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))
                        ) : (
                             // Fallback for legacy sessions without template
                             <>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issue Title</FormLabel>
                                            <FormControl><Input placeholder="Brief title" {...field} /></FormControl>
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
                                            <FormControl><Textarea placeholder="Details..." {...field} /></FormControl>
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
                                                <FormLabel>Device</FormLabel>
                                                <FormControl><Input placeholder="Device model" {...field} /></FormControl>
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
                                                <FormControl><Input placeholder="OS Version" {...field} /></FormControl>
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
                                            <FormLabel>Media URL</FormLabel>
                                            <FormControl><Input placeholder="Image/Video URL" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
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
