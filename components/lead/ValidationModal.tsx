'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface ValidationModalProps {
    issue: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedIssue: any) => void;
}

export function ValidationModal({ issue, open, onOpenChange, onSuccess }: ValidationModalProps) {
    const [loading, setLoading] = useState(false);
    const [severity, setSeverity] = useState<string>('Normal');
    const [comment, setComment] = useState<string>('');

    // Sync state when issue changes (for revalidation)
    useEffect(() => {
        if (issue) {
            setSeverity(issue.severity || 'Normal');
            setComment(issue.leadComment || '');
        }
    }, [issue]);

    if (!issue) return null;

    const handleSubmit = async (finalStatus: string = 'VALIDATED') => {
        if (finalStatus === 'VALIDATED' && !severity) {
            alert('Please select a severity level.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/issues/${issue._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: finalStatus,
                    severity: finalStatus === 'NA' ? undefined : severity,
                    leadComment: comment,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                onSuccess(updated);
                onOpenChange(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Validate Issue</span>
                        <Badge variant={issue.status === 'VALIDATED' ? 'secondary' : issue.status === 'NA' ? 'outline' : 'default'}>
                            {issue.status === 'SUBMITTED' ? 'Not Validated' : issue.status === 'VALIDATED' ? 'Validated' : 'N/A'}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Review and set the severity and comments for this reported issue.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{issue.description}</p>
                    </div>

                    {issue.media && (
                        <div className="space-y-2">
                            <Label>Tester Media</Label>
                            <div className="border rounded-md overflow-hidden bg-muted">
                                <img
                                    src={issue.media}
                                    alt="Issue Media"
                                    className="w-full max-h-[300px] object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="p-2 text-center text-xs">
                                    <a href={issue.media} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                                        View full size
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>Severity (Required for Validation)</Label>
                            <Select value={severity} onValueChange={setSeverity}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Blocker">Blocker</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                    <SelectItem value="Major">Major</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Minor">Minor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Lead Comment (Optional)</Label>
                        <Textarea
                            placeholder="Add your findings or reasoning..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleSubmit('NA')}
                            disabled={loading || !comment.trim()} // Mandatory for NA
                        >
                            Mark as NA {!comment.trim() && '(add comment)'}
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                onClick={() => handleSubmit('VALIDATED')}
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Validation'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
