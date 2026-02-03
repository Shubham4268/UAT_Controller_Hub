'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    titleSchema,
    descriptionSchema,
    deviceDetailsSchema,
    osVersionSchema,
    mediaUrlSchema,
} from '@/lib/validation/schemas';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';
import { IssueTemplate, TemplateField } from '@/config/templates';
import { toast } from 'sonner';

interface IssueEditFormProps {
    issue: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: IssueTemplate;
    onSuccess?: (updatedIssue: any) => void;
}

const CORE_FIELDS = ['title', 'description', 'media', 'deviceDetails', 'osVersion', 'severity'];

const FIELD_LIMITS: Record<string, number> = {
    title: 100,
    description: 2000,
    deviceDetails: 100,
    osVersion: 50,
    media: 500
};

export function IssueEditForm({ issue, open, onOpenChange, template, onSuccess }: IssueEditFormProps) {
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();

    // Generate schema based on template or use default
    const formSchema = useMemo(() => {
        if (!template) {
            return z.object({
                title: titleSchema,
                description: descriptionSchema,
                deviceDetails: deviceDetailsSchema,
                osVersion: osVersionSchema,
                media: mediaUrlSchema,
            });
        }

        const shape: any = {};
        template.fields.forEach((field) => {
            let validator: z.ZodTypeAny = z.string();
            if (field.type === 'url') {
                validator = mediaUrlSchema;
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
        mode: 'onChange', // Enable real-time validation
    });

    // Watch all field values for real-time character count updates
    const watchedValues = form.watch();

    // Reset default values when issue changes or modal opens
    useEffect(() => {
        if (open && issue) {
            const defaults: any = {};
            if (template) {
                template.fields.forEach(f => {
                    const val = CORE_FIELDS.includes(f.key) ? issue[f.key] : issue.dynamicData?.[f.key];
                    defaults[f.key] = val || '';
                });
            } else {
                defaults.title = issue.title || '';
                defaults.description = issue.description || '';
                defaults.deviceDetails = issue.deviceDetails || '';
                defaults.osVersion = issue.osVersion || '';
                defaults.media = issue.media || '';
            }
            form.reset(defaults);
        }
    }, [open, issue, template, form]);

    async function onSubmit(values: any) {
        setLoading(true);
        try {
            // Separate core fields from dynamic data
            const payload: any = {};
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

            const res = await fetch(`/api/issues/${issue._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updatedIssue = await res.json();
                if (socket) {
                    socket.emit('issue:submitted', { ...updatedIssue, sessionId: issue.sessionId });
                }
                toast.success('Resubmitted', { description: 'Issue has been resubmitted for review.' });
                if (onSuccess) onSuccess(updatedIssue);
                onOpenChange(false);
            } else {
                const error = await res.json();
                toast.error('Error', { description: error.error || 'Failed to update issue' });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error', { description: 'An error occurred' });
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Edit & Resubmit Issue
                    </DialogTitle>
                    <DialogDescription>
                        {issue?.leadComment ? (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                                <strong>Lead Instruction:</strong> {issue.leadComment}
                            </div>
                        ) : 'Update the details as requested by your Lead.'}
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
                                    render={({ field: formField }) => {
                                        const limit = FIELD_LIMITS[field.key];
                                        return (
                                            <FormItem className={field.type === 'checkbox' ? 'flex flex-row items-center space-x-3 space-y-0 p-2' : ''}>
                                                {field.type !== 'checkbox' && <FormLabel>{field.label}</FormLabel>}
                                                <FormControl>
                                                    {renderFieldInput(field, { ...formField, maxLength: limit })}
                                                </FormControl>
                                                {limit && field.type !== 'checkbox' && field.type !== 'select' && (
                                                    <div className="flex justify-between items-center">
                                                        <FormMessage />
                                                        <span className="text-xs text-muted-foreground">
                                                            {(watchedValues?.[field.key]?.length || 0)} / {limit}
                                                        </span>
                                                    </div>
                                                )}
                                                {!limit && <FormMessage />}
                                            </FormItem>
                                        );
                                    }}
                                />
                            ))
                        ) : (
                            <>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issue Title</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Brief title"
                                                    maxLength={100}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex justify-between items-center">
                                                <FormMessage />
                                                <span className="text-xs text-muted-foreground">
                                                    {(watchedValues?.title?.length || 0)} / 100
                                                </span>
                                            </div>
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
                                                    placeholder="Details..."
                                                    maxLength={2000}
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex justify-between items-center">
                                                <FormMessage />
                                                <span className="text-xs text-muted-foreground">
                                                    {(watchedValues?.description?.length || 0)} / 2000
                                                </span>
                                            </div>
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
                                                <FormControl>
                                                    <Input
                                                        placeholder="Device model"
                                                        maxLength={100}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="flex justify-between items-center">
                                                    <FormMessage />
                                                    <span className="text-xs text-muted-foreground">
                                                        {(watchedValues?.deviceDetails?.length || 0)} / 100
                                                    </span>
                                                </div>
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
                                                    <Input
                                                        placeholder="OS Version"
                                                        maxLength={50}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="flex justify-between items-center">
                                                    <FormMessage />
                                                    <span className="text-xs text-muted-foreground">
                                                        {(watchedValues?.osVersion?.length || 0)} / 50
                                                    </span>
                                                </div>
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
                                                <Input
                                                    placeholder="https://example.com/image.jpg"
                                                    maxLength={500}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex justify-between items-center">
                                                <FormMessage />
                                                <span className="text-xs text-muted-foreground">
                                                    {(watchedValues?.media?.length || 0)} / 500
                                                </span>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Resubmit Fix
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
