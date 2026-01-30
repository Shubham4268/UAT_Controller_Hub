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

interface Issue {
    _id: string;
    title: string;
    description: string;
    media?: string;
    status: string;
    severity?: string;
    leadComment?: string;
    testerId: {
        name: string;
        username: string;
    };
    createdAt: string;
    validatedAt?: string; // Added validatedAt to interface
}

interface IssueTableProps {
    issues: Issue[];
    mode: 'tester' | 'lead';
    onValidate?: (issue: Issue) => void;
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
    hideStatus = false,
    showComment = false,
    hideAction = false,
    actionLabel = "Validate",
    showTesterName = false
}: IssueTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">S.No</TableHead>
                        {showTesterName && <TableHead>Tester</TableHead>}
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>Media</TableHead>
                        <TableHead>Severity</TableHead>
                        {showComment && <TableHead>Comment</TableHead>}
                        {!hideStatus && <TableHead>Status</TableHead>}
                        <TableHead className="hidden lg:table-cell">Created At</TableHead>
                        {!hideAction && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {issues.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
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
                                <TableCell className="max-w-[150px] truncate hidden md:table-cell">
                                    {issue.description}
                                </TableCell>
                                <TableCell>
                                    {issue.media ? (
                                        <a href={issue.media} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded border bg-muted hover:bg-muted/80 overflow-hidden">
                                            <img
                                                src={issue.media}
                                                alt="Media"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px]">🖼️</span>';
                                                }}
                                            />
                                        </a>
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
                                            <span className="text-xs text-muted-foreground">View Only</span>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
