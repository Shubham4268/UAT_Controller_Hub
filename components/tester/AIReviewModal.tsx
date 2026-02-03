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
import { AlertCircle, XCircle, Loader2, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DuplicateMatch {
    issue: any;
    score: number;
    reasons: string[];
}

interface IssueWithDuplicateCheck {
    _id: string;
    title: string;
    description?: string;
    media?: string;
    status: string;
    testerId: {
        _id: string;
        name: string;
        username: string;
    };
    duplicateCheck: {
        isDuplicate: boolean;
        matches: DuplicateMatch[];
        confidenceScore: number;
    };
}

interface AIReviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId: string;
    onReviewComplete?: () => void;
}

export function AIReviewModal({
    open,
    onOpenChange,
    sessionId,
    onReviewComplete
}: AIReviewModalProps) {
    const [issues, setIssues] = useState<IssueWithDuplicateCheck[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'review' | 'media'>('review');
    const [mediaUrl, setMediaUrl] = useState('');

    const currentIssue = issues[currentIndex];

    // Load issues when modal opens
    useEffect(() => {
        if (open) {
            loadIssues();
            setViewMode('review');
        }
    }, [open, sessionId]);

    useEffect(() => {
        if (currentIssue) {
            setMediaUrl(currentIssue.media || '');
        }
    }, [currentIssue]);

    const loadIssues = async () => {
        setInitialLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/issues/ai-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                throw new Error('Failed to load issues');
            }

            const data = await response.json();
            setIssues(data.issues || []);
            setCurrentIndex(0);

            if (data.issues.length === 0) {
                toast.info('No Issues to Review', {
                    description: 'All your issues have been reviewed or validated.',
                });
                onOpenChange(false);
            }
        } catch (err) {
            console.error('Error loading issues:', err);
            setError('Failed to load issues. Please try again.');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleProceed = () => {
        setViewMode('media');
    };

    const handleBackToReview = () => {
        setViewMode('review');
    };

    const handleMarkAsNA = async () => {
        if (!currentIssue) return;
        
        setError(null);
        setLoading(true);
        
        try {
            const response = await fetch('/api/issues/ai-review/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueId: currentIssue._id,
                    action: 'mark-na',
                    duplicateCheckData: {
                        matchedIssues: currentIssue.duplicateCheck.matches.map(m => m.issue._id),
                        confidenceScore: currentIssue.duplicateCheck.confidenceScore
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark as NA');
            }

            toast.success('Marked as N/A', {
                description: 'Issue has been marked as not applicable.',
            });

            moveToNext();
        } catch (err: any) {
            console.error('Error marking as NA:', err);
            setError(err.message || 'Failed to mark issue as NA');
        } finally {
            setLoading(false);
        }
    };

    const handleMediaSubmit = async () => {
        if (!currentIssue) return;

        if (!mediaUrl.trim()) {
            setError('Media URL is required');
            return;
        }

        try {
            new URL(mediaUrl);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/issues/ai-review/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueId: currentIssue._id,
                    action: 'proceed',
                    mediaUrl,
                    duplicateCheckData: {
                        matchedIssues: currentIssue.duplicateCheck.matches.map(m => m.issue._id),
                        confidenceScore: currentIssue.duplicateCheck.confidenceScore
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit review');
            }

            toast.success('Issue Reviewed', {
                description: 'Issue has been marked as reviewed with media attached.',
            });

            moveToNext();
        } catch (err: any) {
            console.error('Error submitting review:', err);
            setError(err.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const moveToNext = () => {
        if (currentIndex < issues.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setError(null);
            setViewMode('review');
        } else {
            // All issues reviewed
            toast.success('Review Complete', {
                description: 'All issues have been reviewed!',
            });
            onReviewComplete?.();
            handleClose();
        }
    };

    const handleClose = () => {
        if (!loading) {
            setCurrentIndex(0);
            setError(null);
            setViewMode('review');
            setMediaUrl('');
            onOpenChange(false);
        }
    };

    if (initialLoading) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Loading AI Review</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground">Loading issues for review...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!currentIssue || issues.length === 0) {
        return null;
    }

    // TODO: Replace with real AI service
    // For now, always show a dummy duplicate issue
    const dummyDuplicate = {
        issue: {
            _id: 'dummy-123',
            title: 'Similar issue: ' + currentIssue.title.substring(0, 30) + '...',
            description: 'This is a dummy duplicate issue for demonstration. Will be replaced with real AI service.',
            testerId: {
                _id: 'dummy-tester',
                name: 'Other Tester',
                username: 'tester123'
            }
        },
        score: 85,
        reasons: ['Similar title', 'Same module', 'AI analysis pending']
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100/10 rounded-lg border border-purple-500/20">
                                <Sparkles className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <DialogTitle className="text-xl">AI Issue Review</DialogTitle>
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 h-5 text-[10px] px-2">
                                        Issue {currentIndex + 1} of {issues.length}
                                    </Badge>
                                </div>
                                <DialogDescription className="text-slate-400">
                                    Compare reports to identify duplicates.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0">
                    {viewMode === 'review' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Current Issue Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        Your Report
                                    </div>
                                    <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 h-full flex flex-col shadow-inner backdrop-blur-sm">
                                        <h4 className="font-semibold text-sm mb-2 text-blue-200 leading-tight">{currentIssue.title}</h4>
                                        {currentIssue.description && (
                                            <p className="text-xs text-slate-300 mb-4 line-clamp-6 leading-relaxed">
                                                {currentIssue.description}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-4 border-t border-blue-500/10 flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-[9px] border-none">
                                                Current Issue
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Duplicate Match Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        Potential Duplicate
                                    </div>
                                    <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 h-full flex flex-col shadow-inner backdrop-blur-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-sm text-amber-200 leading-tight">{dummyDuplicate.issue.title}</h4>
                                            <Badge className="bg-amber-500/20 text-amber-300 border-none text-[9px]">
                                                {dummyDuplicate.score}% Match
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-300 mb-4 line-clamp-6 leading-relaxed">
                                            {dummyDuplicate.issue.description}
                                        </p>
                                        <div className="mt-auto space-y-3">
                                            <div className="flex flex-wrap gap-1">
                                                {dummyDuplicate.reasons.map((reason, idx) => (
                                                    <Badge key={idx} variant="outline" className="bg-amber-500/10 text-amber-200 border-amber-500/20 text-[8px] px-1.5 py-0">
                                                        {reason}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between text-[10px]">
                                                <span className="text-amber-200/60 font-medium">By {dummyDuplicate.issue.testerId.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                    
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto py-8 space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold">Update Media Link</h3>
                                <p className="text-sm text-muted-foreground">
                                    Provide a valid supporting media URL for this report.
                                </p>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label htmlFor="media-link" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Media URL (Required)
                                    </label>
                                    <input
                                        id="media-link"
                                        type="url"
                                        placeholder="https://example.com/screenshot.jpg"
                                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm bg-background"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {currentIssue?.media && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-tight">Existing Link Found</p>
                                            <p className="text-[10px] text-blue-800 break-all">{currentIssue.media}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs flex items-center justify-between">
                                <span>{error}</span>
                                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 p-0 hover:bg-transparent text-xs underline">
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0 gap-4">
                    {viewMode === 'review' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleMarkAsNA}
                                disabled={loading}
                                className="h-11 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all font-semibold flex-1 text-sm rounded-xl"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Mark current as N/A
                            </Button>
                            <Button
                                onClick={handleProceed}
                                disabled={loading}
                                className="h-11 bg-purple-600 hover:bg-purple-700 text-white transition-all font-semibold flex-1 text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)] rounded-xl"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Proceed to Media
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={handleBackToReview}
                                disabled={loading}
                                className="h-11 font-semibold text-sm rounded-xl px-6 hover:bg-slate-100/5 text-slate-400 hover:text-slate-200"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={handleMediaSubmit}
                                disabled={loading || !mediaUrl.trim()}
                                className="h-11 bg-purple-600 hover:bg-purple-700 text-white transition-all font-semibold flex-1 text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)] rounded-xl"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Complete Review
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
