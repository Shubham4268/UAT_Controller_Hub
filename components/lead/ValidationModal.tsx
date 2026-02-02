'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationModalProps {
    issue: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedIssue: any) => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
    currentIndex?: number;
    totalCount?: number;
}

export function ValidationModal({
    issue,
    open,
    onOpenChange,
    onSuccess,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
    currentIndex,
    totalCount,
}: ValidationModalProps) {
    const [loading, setLoading] = useState(false);
    const [severity, setSeverity] = useState<string>('Normal');
    const [priority, setPriority] = useState<string>('P1');
    const [comment, setComment] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state when issue changes
    useEffect(() => {
        if (issue) {
            setSeverity(issue.severity || 'Normal');
            setPriority(issue.priority || 'P1');
            setComment(issue.leadComment || '');
            setIsSuccess(false); // Reset success state for new issue
        }
    }, [issue]);

    if (!issue) return null;

    const handleSubmit = async (finalStatus: string = 'VALIDATED') => {
        if (finalStatus === 'VALIDATED' && (!severity || !priority)) {
            toast.error('Validation Error', {
                description: 'Please select both severity and priority levels before validating.',
            });
            return;
        }

        if (finalStatus === 'NA' && !comment.trim()) {
            toast.error('Validation Error', {
                description: 'A comment is required when marking an issue as NA.',
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/issues/${issue._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: finalStatus,
                    severity: finalStatus === 'NA' ? 'NA' : severity,
                    priority: finalStatus === 'NA' ? null : priority,
                    leadComment: comment,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                onSuccess(updated);
                setIsSuccess(true);
                toast.success('Issue Validated Successfully', {
                    description: `Marked as ${finalStatus === 'NA' ? 'N/A' : 'Validated'}.`,
                });

                // If it's the last issue, close automatically
                if (!hasNext) {
                    setTimeout(() => {
                        onOpenChange(false);
                    }, 1500);
                }
            } else {
                throw new Error('Failed to update issue');
            }
        } catch (e) {
            console.error(e);
            toast.error('Submission Failed', {
                description: 'Could not validate the issue. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2">
                                <span>Validate Issue</span>
                                <Badge variant={issue.status === 'VALIDATED' ? 'success' : issue.status === 'NA' ? 'outline' : 'default'}>
                                    {issue.status === 'SUBMITTED' ? 'Pending Review' : issue.status === 'VALIDATED' ? 'Validated' : 'N/A'}
                                </Badge>
                            </DialogTitle>
                            {(currentIndex !== undefined && totalCount !== undefined) && (
                                <p className="text-sm text-muted-foreground">
                                    Issue {currentIndex + 1} of {totalCount}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                             <h3 className="font-bold text-lg leading-tight">{issue.title}</h3>
                             <Badge variant="outline" className="shrink-0">{issue.deviceDetails || 'Unknown Device'}</Badge>
                        </div>
                        <div className="max-h-[150px] overflow-y-auto pr-2 bg-muted/30 p-3 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{issue.description}</p>
                        </div>
                    </div>

                    {issue.media && (
                        <div className="space-y-2">
                            <Label>Tester Media</Label>
                            <div className="border rounded-md overflow-hidden bg-muted group relative h-[200px] flex items-center justify-center bg-black/5">
                                <img
                                    src={issue.media}
                                    alt="Issue Media"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <a 
                                    href={issue.media} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:scale-105 transition-transform">
                                        Open Full Size
                                    </span>
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-accent/20 p-4 rounded-xl border">
                        <div className="space-y-2">
                            <Label className="text-primary font-semibold">Set Severity</Label>
                            <Select value={severity} onValueChange={setSeverity}>
                                <SelectTrigger className="bg-background">
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
                        <div className="space-y-2">
                            <Label className="text-primary font-semibold">Set Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select priority..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="P0">P0 (Critical)</SelectItem>
                                    <SelectItem value="P1">P1 (High)</SelectItem>
                                    <SelectItem value="P2">P2 (Medium)</SelectItem>
                                    <SelectItem value="P3">P3 (Low)</SelectItem>
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
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-4 sm:gap-2 items-center border-t pt-4 justify-between">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onPrevious}
                            disabled={!hasPrevious}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNext}
                            disabled={!hasNext}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleSubmit('NA')}
                            disabled={loading}
                        >
                            Mark as NA
                        </Button>
                        <Button
                            onClick={() => handleSubmit('VALIDATED')}
                            disabled={loading}
                            className="bg-primary min-w-[140px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Validation'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
