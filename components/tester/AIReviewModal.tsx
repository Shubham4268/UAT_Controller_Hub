'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Issue {
    _id: string;
    title: string;
    media?: string;
    status: string;
}

interface AIReviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingIssues: Issue[];
    onProceed: (issueId: string) => Promise<boolean>;
    onMarkAsNA: (issueId: string) => Promise<void>;
}

export function AIReviewModal({
    open,
    onOpenChange,
    pendingIssues,
    onProceed,
    onMarkAsNA
}: AIReviewModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentIssue = pendingIssues[currentIndex];

    const handleProceed = async () => {
        if (!currentIssue) return;
        setError(null);
        setLoading(true);
        try {
            const success = await onProceed(currentIssue._id);
            if (success) {
                moveToNext();
            } else {
                setError('Media is required to proceed with a duplicate issue.');
            }
        } catch (err) {
            setError('An error occurred while processing.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsNA = async () => {
        if (!currentIssue) return;
        setError(null);
        setLoading(true);
        try {
            await onMarkAsNA(currentIssue._id);
            moveToNext();
        } catch (err) {
            setError('An error occurred while processing.');
        } finally {
            setLoading(false);
        }
    };

    const moveToNext = () => {
        if (currentIndex < pendingIssues.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onOpenChange(false);
            // Reset for next time after modal closes
            setTimeout(() => setCurrentIndex(0), 300);
        }
    };

    if (pendingIssues.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setTimeout(() => setCurrentIndex(0), 300);
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                        </div>
                        AI Issue Review
                    </DialogTitle>
                    <DialogDescription>
                        Reviewing your reported issues for potential duplicates.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Issue {currentIndex + 1} of {pendingIssues.length}
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border bg-card/50">
                            <h4 className="font-semibold text-sm mb-1">Your Issue:</h4>
                            <p className="text-sm font-medium">{currentIssue.title}</p>
                        </div>
<div className="p-4 rounded-xl border bg-card/50">
                            <h4 className="font-semibold text-sm mb-1">Duplicate Issue:</h4>
                            <p className="text-sm font-medium">{currentIssue.title}</p>
                        </div>
                        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800">Duplicate Suspected</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                ⚠️ Your issue is similar to another issue already reported by a tester.
                            </AlertDescription>
                        </Alert>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/20">
                                <XCircle className="h-3 w-3" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between gap-3">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => onOpenChange(false)}
                    >
                        Skip for now
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleMarkAsNA}
                            disabled={loading}
                            className="gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            Mark as NA
                        </Button>
                        <Button
                            onClick={handleProceed}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Proceed
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Sparkles({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
