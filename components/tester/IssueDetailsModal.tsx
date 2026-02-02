'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, User, Smartphone, AlertTriangle, MessageSquare } from 'lucide-react';

interface IssueDetailsModalProps {
    issue: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SEVERITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Blocker: 'destructive',
    Critical: 'destructive',
    Major: 'default',
    Normal: 'secondary',
    Minor: 'outline',
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    NOT_VALIDATED: 'secondary',
    VALIDATED: 'default',
    NA: 'outline',
};

export function IssueDetailsModal({ issue, open, onOpenChange }: IssueDetailsModalProps) {
    if (!issue) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start gap-4 pr-6">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl leading-tight">{issue.title}</DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {issue.testerId?.name || 'Unknown Tester'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(issue.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 items-end">
                            <Badge variant={STATUS_VARIANTS[issue.status] || 'secondary'}>
                                {issue.status === 'NOT_VALIDATED' ? 'Pending Review' : issue.status}
                            </Badge>
                            {issue.severity && (
                                <Badge variant={SEVERITY_VARIANTS[issue.severity]} className="text-[10px]">
                                    {issue.severity}
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Device Details */}
                    {(issue.deviceDetails || issue.osVersion) && (
                        <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-dashed">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                                <span className="font-semibold">{issue.deviceDetails || 'Unknown Device'}</span>
                                {issue.osVersion && <span className="text-muted-foreground ml-2">({issue.osVersion})</span>}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <div className="min-h-[80px] p-3 bg-muted/30 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed">
                            {issue.description}
                        </div>
                    </div>

                    {/* Dynamic Data */}
                    {issue.dynamicData && Object.keys(issue.dynamicData).length > 0 && (
                        <div className="space-y-2">
                            <Label>Additional Details</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg border border-dashed text-sm">
                                {Object.entries(issue.dynamicData).map(([key, value]) => (
                                    <div key={key} className="flex flex-col">
                                        <span className="text-xs font-semibold uppercase text-muted-foreground mb-0.5">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-foreground">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media */}
                    {issue.media && (
                        <div className="space-y-2">
                            <Label>Attachment</Label>
                            <div className="border rounded-xl overflow-hidden bg-black/5 flex justify-center items-center relative group">
                                <img
                                    src={issue.media}
                                    alt="Issue Proof"
                                    className="max-h-[400px] object-contain w-full"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <a
                                    href={issue.media}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                                >
                                    Open Full Size
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Lead Comments */}
                    {issue.leadComment && (
                        <>
                            <div className="h-px bg-border my-4" />
                            <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <MessageSquare className="h-4 w-4" />
                                    <h4 className="font-semibold text-sm">Lead's Feedback</h4>
                                </div>
                                <p className="text-sm text-blue-900/80">{issue.leadComment}</p>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
