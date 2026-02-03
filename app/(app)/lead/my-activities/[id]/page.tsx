'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IssueSubmissionForm } from '@/components/tester/IssueSubmissionForm';
import { IssueTable } from '@/components/common/IssueTable';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';
import { AIReviewModal } from '@/components/tester/AIReviewModal';
import { IssueDetailsModal } from '@/components/tester/IssueDetailsModal';
import { IssueEditForm } from '@/components/tester/IssueEditForm';
import { toast } from 'sonner';
import { AlertTriangle, AlertCircle, PlayCircle, StopCircle, CheckCircle2, User, Users, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Activity {
    _id: string;
    title: string;
    description: string;
    scope: string;
    status: string;
    metadata?: Record<string, any>;
}

export default function LeadMyActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any | null>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAIReviewOpen, setIsAIReviewOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<any | null>(null);
    const [showMyIssues, setShowMyIssues] = useState(true);
    const [showAllIssues, setShowAllIssues] = useState(true);
    const { socket } = useSocket();
    const currentUserId = user?.userId;

    useEffect(() => {
        async function fetchData() {
            try {
                const [sessionRes, issuesRes, userRes] = await Promise.all([
                    fetch(`/api/test-sessions/${id}`),
                    fetch(`/api/issues?sessionId=${id}`),
                    fetch('/api/auth/me'),
                ]);

                if (sessionRes.ok) setSession(await sessionRes.json());
                if (issuesRes.ok) setIssues(await issuesRes.json());
                if (userRes.ok) setUser(await userRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        if (socket) {
            socket.emit('join:session', id);

            socket.on('issue:refreshed', (updatedIssue: any) => {
                setIssues((prev) =>
                    prev.map((iss) => (iss._id === updatedIssue._id ? updatedIssue : iss))
                );
            });

            socket.on('issue:created', (newIssue: any) => {
                setIssues((prev) => {
                    if (prev.some(iss => iss._id === newIssue._id)) return prev;
                    return [...prev, newIssue];
                });
            });

            socket.on('session:data-updated', (updatedSession: any) => {
                if (updatedSession._id === id) {
                    setSession(updatedSession);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('issue:refreshed');
                socket.off('issue:created');
                socket.off('session:data-updated');
            }
        };
    }, [id, socket]);

    const myIssues = issues.filter(iss => (iss.testerId?._id || iss.testerId) === currentUserId);
    const pendingMyIssues = myIssues.filter(iss => iss.status === 'NOT_VALIDATED');

    const handleAIReviewComplete = () => {
        // Refresh issues after AI review
        fetchIssues();
    };

    const fetchIssues = async () => {
        try {
            const issuesRes = await fetch(`/api/issues?sessionId=${id}`);
            if (issuesRes.ok) {
                const issuesData = await issuesRes.json();
                setIssues(issuesData);
            }
        } catch (error) {
            console.error('Error fetching issues:', error);
        }
    };

    const handleViewIssue = (issue: any) => {
        setSelectedIssue(issue);
        setIsDetailOpen(true);
    };

    const handleEditIssue = (issue: any) => {
        setEditingIssue(issue);
        setIsEditOpen(true);
    };

    if (loading) return <div>Loading details...</div>;
    if (!session) return <div>Session not found.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                        <div className="flex gap-2">
                            <Badge variant={session.status === 'ACTIVE' ? 'success' : 'secondary'} className="h-6">
                                {session.status === 'ACTIVE' ? '● Active' : '● Stopped'}
                            </Badge>
                            {session.completionStatus === 'COMPLETED' && (
                                <Badge variant="outline" className="h-6 bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Completed
                                </Badge>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground capitalize text-sm">Test Session - Tester View (Lead Access)</p>
                </div>
                {session.completionStatus === 'COMPLETED' ? (
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 border-dashed">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Session Completed</span>
                    </div>
                ) : session.status === 'ACTIVE' ? (
                    <IssueSubmissionForm
                        sessionId={id}
                        template={session.template}
                        onSuccess={(newIssue) => {
                            setIssues((prev) => {
                                if (prev.some(iss => iss._id === newIssue._id)) return prev;
                                return [...prev, newIssue];
                            });
                            toast.success("Issue submitted successfully");
                        }}
                    />
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border border-dashed">
                        <StopCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Submission Disabled</span>
                    </div>
                )}
            </div>

            {session.completionStatus === 'COMPLETED' ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Session Successfully Completed</AlertTitle>
                    <AlertDescription>
                        This session has been marked as completed. No further issues can be reported.
                    </AlertDescription>
                </Alert>
            ) : session.status === 'STOPPED' && (
                <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Session Stopped</AlertTitle>
                    <AlertDescription>
                        This test session is currently stopped. Issue submission is disabled.
                    </AlertDescription>
                </Alert>
            )}

            {issues.filter(iss => (iss.testerId?._id || iss.testerId) === currentUserId && iss.status === 'REVIEW_REQUESTED').length > 0 && (
                <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="font-bold">Action Required: Edit Requested</AlertTitle>
                    <AlertDescription>
                        The Lead has requested changes for {issues.filter(iss => (iss.testerId?._id || iss.testerId) === currentUserId && iss.status === 'REVIEW_REQUESTED').length} of your reported issues. Please review and resubmit them.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Session Description</CardTitle>
                    <CardDescription>Details provided by your Lead.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap">{session.description || "No description provided."}</p>
                    <div className="flex gap-2">
                        <Badge variant="outline">
                            {session.scope === 'Both' ? 'Both (UI and Functional)' : session.scope}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <AppQrSection
                androidAppLink={session.androidAppLink}
                iosAppLink={session.iosAppLink}
                androidQr={session.androidQr}
                iosQr={session.iosQr}
            />

            <div className="space-y-12">
                <Card className="overflow-hidden border-2 border-primary/10">
                    <CardHeader
                        className="bg-primary/5 py-3 cursor-pointer select-none transition-colors hover:bg-primary/10"
                        onClick={() => setShowMyIssues(!showMyIssues)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                My Reported Issues ({myIssues.length})
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={myIssues.length === 0}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        // Check if session is active
                                        if (session.status === 'ACTIVE') {
                                            toast.error('Session is Active', {
                                                description: 'AI Review is only available when the session is stopped. Please wait for the lead to stop the session.',
                                            });
                                            return;
                                        }

                                        // Check if there are pending issues
                                        if (pendingMyIssues.length === 0) {
                                            toast.info('No Pending Issues', {
                                                description: 'All your reported issues have been reviewed or validated.',
                                            });
                                            return;
                                        }

                                        setIsAIReviewOpen(true);
                                    }}
                                    className="gap-2 h-7 text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-700 text-purple-600 transition-all shadow-sm"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    AI Review
                                    {pendingMyIssues.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1.5 h-3.5 min-w-[14px] text-[9px] bg-purple-100 text-purple-700">
                                            {pendingMyIssues.length}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-transparent"
                                >
                                    {showMyIssues ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showMyIssues && (
                        <CardContent className="p-0 border-t">
                            <AIReviewModal
                                open={isAIReviewOpen}
                                onOpenChange={setIsAIReviewOpen}
                                sessionId={id}
                                onReviewComplete={handleAIReviewComplete}
                            />
                            <div className="p-4">
                                <IssueTable
                                    issues={myIssues}
                                    mode="tester"
                                    showComment={true}
                                    onView={handleViewIssue}
                                    onEdit={handleEditIssue}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Card className="overflow-hidden border-2 border-primary/10">
                    <CardHeader
                        className="bg-primary/5 py-3 cursor-pointer select-none transition-colors hover:bg-primary/10"
                        onClick={() => setShowAllIssues(!showAllIssues)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    All Issues ({issues.length})
                                </CardTitle>
                                <p className="text-[10px] text-muted-foreground font-normal ml-6">Comprehensive log of all issues reported in this session.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-transparent"
                            >
                                {showAllIssues ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardHeader>
                    {showAllIssues && (
                        <CardContent className="p-4 border-t">
                            <IssueTable
                                issues={issues}
                                mode="tester"
                                showComment={true}
                                onView={handleViewIssue}
                                onEdit={handleEditIssue}
                                currentUserId={currentUserId}
                            />
                        </CardContent>
                    )}
                </Card>
            </div>
            <IssueDetailsModal
                issue={selectedIssue}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
            <IssueEditForm
                issue={editingIssue}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                template={session.template}
                onSuccess={(updated) => {
                    setIssues(prev => prev.map(iss => iss._id === updated._id ? updated : iss));
                }}
            />
        </div>
    );
}
