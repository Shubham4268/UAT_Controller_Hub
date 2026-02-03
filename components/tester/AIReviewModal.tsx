'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, XCircle, CheckCircle2, Sparkles, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Issue {
    _id: string;
    title: string;
    description?: string;
    media?: string;
    status: string;
    deviceDetails?: string;
    osVersion?: string;
    testerId: {
        _id: string;
        name: string;
        username: string;
    };
    createdAt: string;
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
    const [issues, setIssues] = useState<Issue[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'review' | 'media'>('review');
    const [mediaUrl, setMediaUrl] = useState('');
    const [justificationComment, setJustificationComment] = useState('');

    const currentIssue = issues[currentIndex];

    // Dummy duplicate detection logic (frontend only)
    const isDuplicate = currentIndex % 2 === 1;

    // Dummy duplicate data
    const dummyDuplicate = {
        _id: 'dummy-' + Date.now(),
        title: 'App crashes on login',
        description: 'Crash observed when invalid OTP is entered. Same behavior as reported in multiple sessions.',
        media: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400',
        testerId: {
            _id: 'dummy-tester',
            name: 'John Doe',
            username: 'johndoe'
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        score: 85,
        reasons: ['Similar title', 'Same module', 'Matching description']
    };

    // Load issues when modal opens
    useEffect(() => {
        if (open) {
            loadIssues();
            setViewMode('review');
        }
    }, [open, sessionId]);

    // Update media URL when issue changes
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

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setError(null);
            setViewMode('review');
        }
    };

    const handleNext = () => {
        if (currentIndex < issues.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setError(null);
            setViewMode('review');
        }
    };

    const moveToNext = () => {
        if (currentIndex < issues.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setError(null);
            setViewMode('review');
        } else {
            // All issues reviewed
            toast.success('Review Complete!', {
                description: 'All issues have been reviewed.',
            });
            onReviewComplete?.();
            handleClose();
        }
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
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark as NA');
            }

            toast.success('Marked as N/A', {
                description: 'Issue has been marked as duplicate and removed from validation queue.',
            });

            moveToNext();
        } catch (err: any) {
            console.error('Error marking as NA:', err);
            setError(err.message || 'Failed to mark issue as NA');
        } finally {
            setLoading(false);
        }
    };

    const handleProceed = () => {
        setViewMode('media');
        setError(null);
    };

    const handleBackToReview = () => {
        setViewMode('review');
        setError(null);
    };

    const handleMediaSubmit = async () => {
        if (!currentIssue) return;

        // Validate media requirement for duplicates
        if (isDuplicate && !mediaUrl.trim()) {
            setError('Media is required to proceed with duplicate issue');
            return;
        }

        // Validate URL format if media is provided
        if (mediaUrl.trim()) {
            try {
                const url = new URL(mediaUrl);

                // Check if URL is HTTP/HTTPS
                if (!['http:', 'https:'].includes(url.protocol)) {
                    setError('Media URL must use HTTP or HTTPS protocol');
                    return;
                }
            } catch {
                setError('Please enter a valid URL');
                return;
            }
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
                    mediaUrl: mediaUrl || currentIssue.media,
                    justificationComment: isDuplicate ? justificationComment : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit review');
            }

            toast.success('Issue Reviewed', {
                description: 'Issue has been marked as reviewed.',
            });

            moveToNext();
        } catch (err: any) {
            console.error('Error submitting review:', err);
            setError(err.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setCurrentIndex(0);
            setError(null);
            setViewMode('review');
            setMediaUrl('');
            setJustificationComment('');
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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[70vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Sticky Header */}
                <DialogHeader className="p-6 pb-4 border-b shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100/10 rounded-lg border border-purple-500/20">
                                <Sparkles className="h-5 w-5 text-purple-400" />
                            </div>
                            <DialogTitle className="text-xl">AI Issue Review</DialogTitle>
                        </div>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                            Issue {currentIndex + 1} of {issues.length}
                        </Badge>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0 || loading}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            Navigate through issues
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentIndex === issues.length - 1 || loading}
                            className="gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-6">
                    {viewMode === 'review' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Left Panel - Current Issue */}
                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    Current Issue
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 text-blue-200">{currentIssue.title}</h4>
                                        {currentIssue.description && (
                                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                {currentIssue.description}
                                            </p>
                                        )}
                                    </div>

                                    {currentIssue.media && (
                                        <div>
                                            <p className="text-xs font-semibold mb-2 text-blue-300">Media</p>
                                            <img
                                                src={currentIssue.media}
                                                alt="Issue media"
                                                className="w-full rounded-lg border border-blue-500/20"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-blue-500/10 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-300/60">Created by</span>
                                            <span className="text-blue-200 font-medium">{currentIssue.testerId.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-300/60">Created at</span>
                                            <span className="text-blue-200 font-medium">
                                                {new Date(currentIssue.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {currentIssue.deviceDetails && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-blue-300/60">Device</span>
                                                <span className="text-blue-200 font-medium">{currentIssue.deviceDetails}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Duplicate or No Duplicate */}
                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDuplicate ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                                    {isDuplicate ? 'Potential Duplicate' : 'Analysis'}
                                </div>

                                {isDuplicate ? (
                                    <div className="flex-1 overflow-y-auto p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-base text-amber-200">{dummyDuplicate.title}</h4>
                                            <Badge className="bg-amber-500/20 text-amber-300 border-none text-xs shrink-0">
                                                {dummyDuplicate.score}% Match
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {dummyDuplicate.description}
                                        </p>

                                        {dummyDuplicate.media && (
                                            <div>
                                                <p className="text-xs font-semibold mb-2 text-amber-300">Media</p>
                                                <img
                                                    src={dummyDuplicate.media}
                                                    alt="Duplicate media"
                                                    className="w-full rounded-lg border border-amber-500/20"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold mb-2 text-amber-300">Match Reasons</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {dummyDuplicate.reasons.map((reason, idx) => (
                                                        <Badge key={idx} variant="outline" className="bg-amber-500/10 text-amber-200 border-amber-500/20 text-xs">
                                                            {reason}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-amber-500/10 space-y-2 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-amber-300/60">Reported by</span>
                                                    <span className="text-amber-200 font-medium">{dummyDuplicate.testerId.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-amber-300/60">Reported at</span>
                                                    <span className="text-amber-200 font-medium">
                                                        {new Date(dummyDuplicate.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Alert className="bg-amber-500/10 border-amber-500/20">
                                            <AlertCircle className="h-4 w-4 text-amber-400" />
                                            <AlertDescription className="text-xs text-amber-200">
                                                <strong>⚠️ Dummy Data:</strong> This is a frontend-only demo. Real AI duplicate detection will be implemented later.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto p-4 rounded-xl border bg-green-500/5 border-green-500/20 flex flex-col items-center justify-center text-center space-y-3">
                                        <CheckCircle2 className="h-12 w-12 text-green-400" />
                                        <div>
                                            <h4 className="font-semibold text-base text-green-200 mb-1">No Duplicates Found</h4>
                                            <p className="text-sm text-slate-300">
                                                This issue appears to be unique. You can proceed with validation.
                                            </p>
                                        </div>
                                        <Alert className="bg-green-500/10 border-green-500/20 text-left">
                                            <AlertCircle className="h-4 w-4 text-green-400" />
                                            <AlertDescription className="text-xs text-green-200">
                                                <strong>ℹ️ Dummy Logic:</strong> Duplicate detection uses alternating pattern (every 2nd issue). Real AI coming soon.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold">Add or Update Media</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isDuplicate
                                        ? 'Media is required to proceed with duplicate issues.'
                                        : 'Provide supporting media for this issue (optional).'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="media-url" className="text-sm font-semibold">
                                        Media URL {isDuplicate && <span className="text-destructive">*</span>}
                                    </label>
                                    <Input
                                        id="media-url"
                                        type="url"
                                        placeholder="https://example.com/screenshot.jpg"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        className="h-11"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter a valid URL to an image or video
                                    </p>
                                </div>

                                {isDuplicate && (
                                    <div className="space-y-2">
                                        <label htmlFor="justification" className="text-sm font-semibold">
                                            Justification Comment <span className="text-muted-foreground">(Optional)</span>
                                        </label>
                                        <textarea
                                            id="justification"
                                            placeholder="Explain why this duplicate issue should be kept (e.g., different device, different scenario, additional context...)"
                                            value={justificationComment}
                                            onChange={(e) => setJustificationComment(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border bg-background min-h-[80px] text-sm resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                            maxLength={500}
                                        />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Why keep this duplicate instead of marking as N/A?</span>
                                            <span>{justificationComment.length}/500</span>
                                        </div>
                                    </div>
                                )}

                                {currentIssue?.media && (
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-blue-400" />
                                            <p className="text-sm font-semibold text-blue-300">Existing Media</p>
                                        </div>
                                        <p className="text-xs text-blue-200 wrap-break-word overflow-wrap-anywhere">{currentIssue.media}</p>
                                        <img
                                            src={currentIssue.media}
                                            alt="Existing media"
                                            className="w-full rounded-lg border border-blue-500/20 mt-2"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                {mediaUrl && mediaUrl !== currentIssue?.media && (
                                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                                            <p className="text-sm font-semibold text-green-300">New Media Preview</p>
                                        </div>
                                        <p className="text-xs text-green-200 wrap-break-word overflow-wrap-anywhere">{mediaUrl}</p>
                                        <img
                                            src={mediaUrl}
                                            alt="New media preview"
                                            className="w-full rounded-lg border border-green-500/20 mt-2"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm flex items-center justify-between">
                                <span>{error}</span>
                                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 p-0 hover:bg-transparent text-xs underline">
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Sticky Footer */}
                <DialogFooter className="p-6 pt-4 border-t shrink-0 gap-3">
                    {viewMode === 'review' ? (
                        isDuplicate ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleMarkAsNA}
                                    disabled={loading}
                                    className="flex-1 h-11 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 gap-2"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Mark as N/A
                                </Button>
                                <Button
                                    onClick={handleProceed}
                                    disabled={loading}
                                    className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Proceed to Media
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleProceed}
                                disabled={loading}
                                className="w-full h-11 bg-purple-600 hover:bg-purple-700 gap-2"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Proceed to Media
                            </Button>
                        )
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleBackToReview}
                                disabled={loading}
                                className="h-11 gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Review
                            </Button>
                            <Button
                                onClick={handleMediaSubmit}
                                disabled={loading || (isDuplicate && !mediaUrl.trim())}
                                className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Complete Review
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
