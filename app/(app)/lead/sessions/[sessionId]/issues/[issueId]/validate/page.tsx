'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    Edit3, 
    ArrowLeft,
    Monitor,
    Calendar,
    User as UserIcon,
    Hash,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

// Helper for status variants
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
    'NOT_VALIDATED': 'default',
    'VALIDATED': 'success',
    'NA': 'outline',
    'REVIEW_REQUESTED': 'outline',
    'REVIEWED': 'secondary',
};

const SEVERITY_LIST = ['Blocker', 'Critical', 'Major', 'Normal', 'Minor', 'NA'];
const PRIORITY_LIST = ['P0', 'P1', 'P2', 'P3'];

export default function IssueValidationPage({ params }: { params: Promise<{ sessionId: string; issueId: string }> }) {
    const { sessionId, issueId } = use(params);
    const router = useRouter();

    const [issue, setIssue] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [sessionIssues, setSessionIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [severity, setSeverity] = useState<string>('');
    const [priority, setPriority] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [issueRes, allIssuesRes, sessionRes] = await Promise.all([
                    fetch(`/api/issues/${issueId}`),
                    fetch(`/api/issues?sessionId=${sessionId}`),
                    fetch(`/api/test-sessions/${sessionId}`)
                ]);

                if (issueRes.ok) {
                    const data = await issueRes.json();
                    setIssue(data);
                    setSeverity(data.status === 'NA' ? 'NA' : (data.severity || ''));
                    setPriority(data.status === 'NA' ? '' : (data.priority || ''));
                    setComment(data.leadComment || '');
                    setTitle(data.title);
                    setDescription(data.description);
                }

                if (allIssuesRes.ok) {
                    setSessionIssues(await allIssuesRes.json());
                }

                if (sessionRes.ok) {
                    setSession(await sessionRes.json());
                }
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Error', { description: 'Failed to load details' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [issueId, sessionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <p className="text-muted-foreground">Issue not found</p>
                <Button onClick={() => router.push(`/lead/activities/${sessionId}`)} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Session
                </Button>
            </div>
        );
    }

    // Navigation and Progress logic
    const isRevalidationFlow = issue && (issue.status === 'VALIDATED' || issue.status === 'NA');
    
    const navIssues = isRevalidationFlow
        ? sessionIssues.filter(iss => iss.status === 'VALIDATED' || iss.status === 'NA')
        : sessionIssues.filter(iss => iss.status === 'NOT_VALIDATED' || iss.status === 'REVIEW_REQUESTED');

    const totalInFlow = navIssues.length;
    const validatedIssues = sessionIssues.filter(iss => iss.status === 'VALIDATED' || iss.status === 'NA').length;
    const totalIssues = sessionIssues.length;
    const progressPercent = totalIssues > 0 ? (validatedIssues / totalIssues) * 100 : 0;
    
    const currentNavIndex = navIssues.findIndex(iss => iss._id === issueId);
    const hasNext = currentNavIndex < navIssues.length - 1;
    const hasPrevious = currentNavIndex > 0;

    const navigateTo = (idx: number) => {
        const nextIssue = navIssues[idx];
        if (nextIssue) {
            router.push(`/lead/sessions/${sessionId}/issues/${nextIssue._id}/validate`);
        }
    };

    const handleAction = async (status: string) => {
        if (status === 'VALIDATED' && !severity) {
            toast.error('Validation Error', { description: 'Please select severity' });
            return;
        }

        if ((status === 'NA' || status === 'REVIEW_REQUESTED') && !comment.trim()) {
            toast.error('Validation Error', { description: `A comment is required for ${status === 'NA' ? 'NA' : 'Edit Request'}` });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/issues/${issueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    severity: status === 'NA' ? 'NA' : severity,
                    priority: status === 'NA' ? '' : priority,
                    leadComment: comment,
                    title,
                    description,
                }),
            });

            if (res.ok) {
                toast.success('Success', { description: `Issue status updated to ${status}` });
                
                // Navigation Logic:
                // 1. If there's a next issue in the current flow's list, go to it
                // 2. If no "next" but still issues left in this set (due to jump around), go to first remaining
                // 3. Otherwise exit
                
                if (hasNext) {
                    navigateTo(currentNavIndex + 1);
                } else {
                    const remainingInSet = navIssues.filter(iss => iss._id !== issueId);
                    if (remainingInSet.length > 0) {
                        router.push(`/lead/sessions/${sessionId}/issues/${remainingInSet[0]._id}/validate`);
                    } else {
                        router.push(`/lead/activities/${sessionId}`);
                    }
                }
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            toast.error('Error', { description: 'Failed to update issue' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] -mt-6 -mx-6 overflow-hidden">
            {/* Premium Glass Header - Now fixed at the top of this local container */}
            <div className="z-20 backdrop-blur-xl bg-card/80 border-b border-primary/10 p-4 shadow-sm shrink-0 px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold flex items-center gap-3">
                            <Hash className="h-5 w-5 text-primary" />
                            {currentNavIndex !== -1 
                                ? `${isRevalidationFlow ? 'Revalidating' : 'Validating'} Issue ${currentNavIndex + 1} of ${totalInFlow} ${isRevalidationFlow ? 'previously resolved' : 'pending'}`
                                : `Viewing Issue`}
                        </h1>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={!hasPrevious}
                                onClick={() => navigateTo(currentNavIndex - 1)}
                                className="h-9 px-4 rounded-xl border-2 hover:bg-muted"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={!hasNext}
                                onClick={() => navigateTo(currentNavIndex + 1)}
                                className="h-9 px-4 rounded-xl border-2 hover:bg-muted"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                            <div className="w-[1px] h-6 bg-border mx-1 hidden md:block" />
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => router.push(`/lead/activities/${sessionId}`)}
                                className="h-9 px-4 rounded-xl hidden md:flex items-center gap-2"
                            >
                                <XCircle className="h-4 w-4" /> Exit Review
                            </Button>
                        </div>
                        
                        {/* Progress Indicator */}
                        <div className="w-full md:w-64 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Validation Progress</span>
                                <span>{validatedIssues} / {totalIssues}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500 ease-in-out" 
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full max-w-7xl mx-auto">
                    {/* Left Panel: Content - This one SCROLLS */}
                    <div className="lg:col-span-7 h-full overflow-y-auto p-6 scroll-smooth thin-scrollbar">
                        <Card className="overflow-hidden border-2 border-primary/5 shadow-md">
                            <CardHeader className="bg-muted/30 border-b">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                            <Badge variant={STATUS_VARIANTS[issue.status] || 'default'}>
                                                {issue.status.replace('_', ' ')}
                                            </Badge>
                                        </CardTitle>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1">
                                            <div className="flex items-center gap-1">
                                                <UserIcon className="h-3 w-3" />
                                                <span>{issue.testerId?.name} (@{issue.testerId?.username})</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Reported on {formatDate(issue.createdAt)}</span>
                                            </div>
                                            {issue.deviceDetails && (
                                                <div className="flex items-center gap-1">
                                                    <Monitor className="h-3 w-3" />
                                                    <span>{issue.deviceDetails}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Title
                                        </Label>
                                        <div className="space-y-1">
                                            <Input 
                                                value={title} 
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                                className="h-10 font-semibold text-lg border-2 focus-visible:ring-primary/30"
                                                placeholder="Title override..."
                                                maxLength={100}
                                            />
                                            <div className="flex justify-end">
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {title.length} / 100
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Description</Label>
                                        <div className="space-y-1">
                                            <Textarea 
                                                value={description} 
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                                className="min-h-[100px] whitespace-pre-wrap text-sm border-2 focus-visible:ring-primary/30"
                                                placeholder="Description override..."
                                                maxLength={1000}
                                            />
                                            <div className="flex justify-end">
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {description.length} / 1000
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-primary font-semibold">Severity</Label>
                                        <Select value={severity} onValueChange={setSeverity}>
                                            <SelectTrigger className="bg-background border-2">
                                                <SelectValue placeholder="Severity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEVERITY_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-primary font-semibold">Priority</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger className="bg-background border-2">
                                                <SelectValue placeholder="Priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRIORITY_LIST.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Lead Comment (Required for NA / Edit Requests)</Label>
                                    <div className="space-y-1">
                                        <Textarea 
                                            placeholder="Add findings, reasoning, or requested changes..."
                                            value={comment}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                            className="min-h-[100px] border-2 focus-visible:ring-primary/30"
                                            maxLength={1000}
                                        />
                                        <div className="flex justify-end">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {comment.length} / 1000
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                    <Button 
                                        onClick={() => handleAction('VALIDATED')} 
                                        disabled={submitting}
                                        className="bg-green-600 hover:bg-green-700 font-bold flex-1"
                                    >
                                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Submit Validation
                                    </Button>
                                    
                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleAction('REVIEW_REQUESTED')}
                                        disabled={submitting}
                                        className="border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold flex-1"
                                    >
                                        <Edit3 className="h-4 w-4 mr-2" /> Request Edit
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleAction('NA')}
                                        disabled={submitting}
                                        className="border-destructive text-destructive hover:bg-destructive/5 font-semibold flex-1"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" /> Mark as NA
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Media - Partially fixed height, internal scroll */}
                    <div className="lg:col-span-5 h-full p-6 border-l bg-muted/5">
                        <Card className="h-full overflow-hidden flex flex-col border-2 border-primary/5 shadow-sm">
                            <CardHeader className="bg-primary/5 py-3 shrink-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        📹 Media Preview
                                    </CardTitle>
                                
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 overflow-y-auto bg-black/5 flex items-center justify-center">
                                {issue.media ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {issue.media.match(/\.(mp4|webm|ogg)$/i) || issue.media.includes('video') ? (
                                            <video 
                                                src={issue.media} 
                                                controls 
                                                className="max-w-full max-h-full rounded-md shadow-lg"
                                            />
                                        ) : issue.media.match(/\.(mp3|wav|ogg)$/i) || issue.media.includes('audio') ? (
                                            <audio 
                                                src={issue.media} 
                                                controls 
                                                className="w-full"
                                            />
                                        ) : issue.media.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) || issue.media.includes('image') ? (
                                            <img 
                                                src={issue.media} 
                                                alt="Issue Media" 
                                                className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                                            />
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <div className="p-4 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                                    <ExternalLink className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium">No preview available for this file type</p>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => window.open(issue.media, '_blank')}
                                                        className="gap-2"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Open in New Tab
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2 opacity-50">
                                        <div className="p-4 bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                            <XCircle className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium">No media attached</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
