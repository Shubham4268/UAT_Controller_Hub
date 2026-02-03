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
            <DialogContent className="max-w-[50vw] max-h-[90vh] w-full flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight wrap-break-word">
                            {issue.title}
                        </DialogTitle>
                        <Badge variant={STATUS_VARIANTS[issue.status] || 'secondary'} className="shrink-0 h-6 mt-4">
                            {issue.status === 'NOT_VALIDATED' ? 'Pending Review' : issue.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    {/* Status Banner - Review Requested */}
                    {issue.status === 'REVIEW_REQUESTED' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-900">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-semibold text-sm">Action Required: Review Requested</h4>
                                {issue.leadComment && (
                                    <p className="text-sm text-amber-800">{issue.leadComment}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-b pb-4">
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Created {new Date(issue.createdAt).toLocaleString()}</span>
                        </div>
                        {issue.severity && (
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                                <span className="font-medium text-foreground/80">Severity:</span>
                                <span>{issue.severity}</span>
                            </div>
                        )}
                        {(issue.deviceDetails || issue.osVersion) && (
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                                <Smartphone className="h-3.5 w-3.5" />
                                <span>{issue.deviceDetails || 'Unknown Device'} {issue.osVersion ? `(${issue.osVersion})` : ''}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                            <User className="h-3.5 w-3.5" />
                            <span>@{issue.testerId?.username || 'unknown'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">Description</h3>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 p-4 rounded-lg border">
                            {issue.description}
                        </div>
                    </div>

                    {/* Dynamic Data */}
                    {issue.dynamicData && Object.keys(issue.dynamicData).length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">Additional Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(issue.dynamicData).map(([key, value]) => (
                                    <div key={key} className="p-3 bg-muted/20 rounded-lg border">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm wrap-break-word">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media */}
                    {issue.media ? (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">Attached Media</h3>
                            <div className="rounded-xl overflow-hidden border bg-black/5">
                                <img
                                    src={issue.media}
                                    alt="Issue Evidence"
                                    className="w-full h-auto object-contain max-h-[60vh] mx-auto"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `
                                            <div class="p-8 text-center text-muted-foreground">
                                                <p>Media preview is not supported</p>
                                                <a href="${issue.media}" target="_blank" class="text-primary hover:underline text-sm mt-2 inline-block">Open Link Directly</a>
                                            </div>
                                        `;
                                    }}
                                />
                                <div className="p-3 bg-muted/50 border-t flex justify-end">
                                    <Button variant="outline" size="sm" asChild className="gap-2">
                                        <a href={issue.media} target="_blank" rel="noopener noreferrer">
                                            Open Full Size
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                            No media attached
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
