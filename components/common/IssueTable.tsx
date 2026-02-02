'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MediaPreviewModal } from './MediaPreviewModal';

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    NOT_VALIDATED: 'secondary',
    VALIDATED: 'default', // Using default/primary for validated
    NA: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
    NOT_VALIDATED: 'Not Validated',
    VALIDATED: 'Validated',
    NA: 'N/A',
};

const SEVERITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Blocker: 'destructive',
    Critical: 'destructive',
    Major: 'default',
    Normal: 'secondary',
    Minor: 'outline',
};

const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    P0: 'destructive',
    P1: 'destructive',
    P2: 'default',
    P3: 'secondary',
};

interface Issue {
    _id: string;
    title: string;
    description: string;
    deviceDetails?: string;
    osVersion?: string;
    media?: string;
    status: string;
    severity?: string;
    priority?: string;
    leadComment?: string;
    testerId: {
        name: string;
        username: string;
    };
    createdAt: string;
    validatedAt?: string; // Added validatedAt to interface
    dynamicData?: Record<string, any>;
}

interface IssueTableProps {
    issues: Issue[];
    mode: 'tester' | 'lead';
    onValidate?: (issue: Issue) => void;
    onView?: (issue: Issue) => void;
    hideStatus?: boolean;
    showComment?: boolean;
    hideAction?: boolean;
    actionLabel?: string;
    showTesterName?: boolean;
}

export function IssueTable({
    issues,
    mode,
    onValidate,
    onView,
    hideStatus = false,
    showComment = false,
    hideAction = false,
    actionLabel = "Validate",
    showTesterName = true
}: IssueTableProps) {
    const [previewMedia, setPreviewMedia] = useState<string | null>(null);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">S.No</TableHead>
                        {showTesterName && <TableHead>Created By</TableHead>}
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Device/OS</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>Media</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Priority</TableHead>
                        {showComment && <TableHead>Comment</TableHead>}
                        {!hideStatus && <TableHead>Status</TableHead>}
                        <TableHead className="hidden lg:table-cell">Created At</TableHead>
                        {!hideAction && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {issues.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                                No issues reported yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        issues.map((issue, index) => (
                            <TableRow key={issue._id}>
                                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                {showTesterName && (
                                    <TableCell className="font-medium">
                                        {issue.testerId?.name || 'Unknown'}
                                        <p className="text-xs text-muted-foreground">@{issue.testerId?.username}</p>
                                    </TableCell>
                                )}
                                <TableCell className="font-medium">{issue.title}</TableCell>
                                <TableCell className="hidden md:table-cell text-xs">
                                    {issue.deviceDetails ? (
                                        <div className="flex flex-col">
                                            <span>{issue.deviceDetails}</span>
                                            <span className="text-muted-foreground">{issue.osVersion}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate hidden md:table-cell">
                                    {issue.description}
                                </TableCell>
                                <TableCell>
                                    {issue.media ? (
                                        <button 
                                            onClick={() => setPreviewMedia(issue.media || null)}
                                            className="flex items-center justify-center w-8 h-8 rounded border bg-muted hover:bg-muted/80 overflow-hidden cursor-pointer transition-colors"
                                        >
                                            <img
                                                src={issue.media}
                                                alt="Media"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px]">🖼️</span>';
                                                }}
                                            />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {issue.severity ? (
                                        <Badge variant={SEVERITY_VARIANTS[issue.severity] || 'outline'} className="text-[10px]">
                                            {issue.severity}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {issue.priority ? (
                                        <Badge variant={PRIORITY_VARIANTS[issue.priority] || 'outline'} className="text-[10px]">
                                            {issue.priority}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                {showComment && (
                                    <TableCell className="max-w-[150px] truncate text-xs italic text-muted-foreground">
                                        {issue.leadComment || '—'}
                                    </TableCell>
                                )}
                                {!hideStatus && (
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANTS[issue.status] || 'default'}>
                                            {STATUS_LABELS[issue.status] || issue.status}
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                                    {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </TableCell>
                                {!hideAction && (
                                    <TableCell className="text-right">
                                        {mode === 'lead' ? (
                                            <Button size="sm" variant="outline" onClick={() => onValidate?.(issue)}>
                                                {actionLabel}
                                            </Button>
                                        ) : (
                                            onView ? (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onView(issue)}>
                                                    <span className="sr-only">View</span>
                                                    {/* Importing Eye icon here to avoid top-level import conflict if needed, or assume it's imported */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-eye"
                                                    >
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">View Only</span>
                                            )
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <MediaPreviewModal 
                open={!!previewMedia} 
                url={previewMedia} 
                onOpenChange={(open) => !open && setPreviewMedia(null)} 
            />
        </div>
    );
}
