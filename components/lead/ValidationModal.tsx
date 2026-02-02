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
    totalCount
}: ValidationModalProps) {
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
                // Do not close modal here if we want to continue validating
                // But the requirement says "Submit still validates current active issue". 
                // Usually validation implies done. 
                // If the user wants to continue "without closing", they might use Next/Prev.
                // However, submitting might auto-advance? The prompt didn't strictly say auto-advance on submit,
                // but "Clicking them switches issue without closing modal".
                // Let's close on submit for now as per original behavior, unless we want to auto-next.
                // The prompt says "No backend changes required. Navigation limited to Issues To Be Validated table."
                // "Submit still validates current active issue."
                // "Allows Leads to navigate... so multiple issues can be validated continuously without closing the modal."
                // This implies they can view -> next -> view -> next. 
                // But VALIDATION removes it from the "Pending" list usually?
                // If I validate issue A, it goes to "Validated". The index in "Pending" shifts.
                // This is tricky. If I validate, the list changes.
                // For now let's keep close on submit to be safe, or just call onSuccess and let parent handle closure/next.
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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2">
                                <span>Validate Issue</span>
                                <Badge variant={issue.status === 'VALIDATED' ? 'secondary' : issue.status === 'NA' ? 'outline' : 'default'}>
                                    {issue.status === 'SUBMITTED' ? 'Not Validated' : issue.status === 'VALIDATED' ? 'Validated' : 'N/A'}
                                </Badge>
                            </DialogTitle>
                            {(currentIndex !== undefined && totalCount !== undefined) && (
                                <p className="text-sm text-muted-foreground">
                                    Issue {currentIndex + 1} of {totalCount}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                             {/* Navigation Buttons in Header for easy access */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrevious}
                                disabled={!hasPrevious}
                                title="Previous Issue"
                            >
                                ⬅
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onNext}
                                disabled={!hasNext}
                                title="Next Issue"
                            >
                                ➡
                            </Button>
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
                            <div className="border rounded-md overflow-hidden bg-muted group relative">
                                <img
                                    src={issue.media}
                                    alt="Issue Media"
                                    className="w-full max-h-[300px] object-contain bg-black/5"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity pointer-events-none">
                                     <a 
                                        href={issue.media} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="bg-background/80 text-foreground px-3 py-1 rounded-full text-xs font-medium pointer-events-auto hover:bg-background"
                                     >
                                        Open Full Size
                                     </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 bg-accent/20 p-4 rounded-xl border">
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

                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 gap-4">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleSubmit('NA')}
                            disabled={loading || !comment.trim()}
                        >
                            Mark as NA {!comment.trim() && '(add comment)'}
                        </Button>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">Cancel</Button>
                            <Button
                                onClick={() => handleSubmit('VALIDATED')}
                                disabled={loading}
                                className="flex-1 sm:flex-none"
                            >
                                {loading ? 'Submitting...' : 'Submit Validation'}
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Footer Navigation (redundant but requested in footer too/alternatively) - sticking to header for visibility as per my design choice, but let's add simple arrows next to submit if needed. The prompt suggested "Footer, beside Submit button". Let's do that for better UX flow. */}
                 <div className="flex justify-between items-center pt-4 border-t mt-4 text-xs text-muted-foreground">
                    <div>
                        {hasPrevious ? (
                            <span 
                                className="cursor-pointer hover:text-foreground flex items-center gap-1"
                                onClick={onPrevious}
                            >
                                ⬅ Previous Issue
                            </span>
                        ) : <span className="opacity-30">⬅ Previous Issue</span>}
                    </div>
                     <div>
                        {hasNext ? (
                            <span 
                                className="cursor-pointer hover:text-foreground flex items-center gap-1"
                                onClick={onNext}
                            >
                                Next Issue ➡
                            </span>
                        ) : <span className="opacity-30">Next Issue ➡</span>}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
