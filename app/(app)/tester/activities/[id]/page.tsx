'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IssueSubmissionForm } from '@/components/tester/IssueSubmissionForm';
import { IssueTable } from '@/components/common/IssueTable';
import { AppQrSection } from '@/components/common/AppQrSection';
import { useSocket } from '@/components/providers/SocketProvider';
import { AlertCircle, PlayCircle, StopCircle, CheckCircle2, User, Users, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AIReviewModal } from '@/components/tester/AIReviewModal';
import { IssueDetailsModal } from '@/components/tester/IssueDetailsModal';

interface Activity {
    _id: string;
    title: string;
    description: string;
    scope: string;
    status: string;
    metadata?: Record<string, any>;
}

export default function TesterActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any | null>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAIReviewOpen, setIsAIReviewOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
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

    const handleAIProceed = async (issueId: string) => {
        const issue = issues.find(iss => iss._id === issueId);
        if (!issue) return true;

        if (!issue.media) {
            return false;
        }
        return true;
    };

    const handleAIMarkAsNA = async (issueId: string) => {
        // Local only update as per requirements
        setIssues(prev => prev.map(iss =>
            iss._id === issueId ? { ...iss, status: 'NA' } : iss
        ));
    };

    const handleViewIssue = (issue: any) => {
        setSelectedIssue(issue);
        setIsDetailOpen(true);
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
                    <p className="text-muted-foreground capitalize text-sm">Test Session - Reporter View</p>
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
                        This session has been marked as completed by the Lead. No further issues can be reported.
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
                                    disabled={myIssues.length === 0 || session.status === 'ACTIVE'}
                                    onClick={(e) => {
                                        e.stopPropagation();
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
                                pendingIssues={pendingMyIssues}
                                onProceed={handleAIProceed}
                                onMarkAsNA={handleAIMarkAsNA}
                            />
                            <div className="p-4">
                                <IssueTable
                                    issues={issues.filter(iss => (iss.testerId?._id || iss.testerId) === currentUserId)}
                                    mode="tester"
                                    showComment={true}
                                    onView={handleViewIssue}
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
                                    All Session Issues ({issues.length})
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
        </div>
    );
}
