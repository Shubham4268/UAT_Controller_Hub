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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MediaUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadComplete: (mediaUrl: string) => void;
    issueTitle: string;
    existingMediaUrl?: string;
}

export function MediaUploadDialog({
    open,
    onOpenChange,
    onUploadComplete,
    issueTitle,
    existingMediaUrl
}: MediaUploadDialogProps) {
    const [mediaUrl, setMediaUrl] = useState(existingMediaUrl || '');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleUrlSubmit = () => {
        setError(null);

        // Validate URL
        if (!mediaUrl.trim()) {
            setError('Media URL is required');
            return;
        }

        // Basic URL validation
        try {
            new URL(mediaUrl);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        // Simulate upload progress for URL submission
        setUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setUploading(false);
                    setUploadSuccess(true);
                    setTimeout(() => {
                        onUploadComplete(mediaUrl);
                        handleClose();
                    }, 500);
                    return 100;
                }
                return prev + 20;
            });
        }, 100);
    };

    const handleClose = () => {
        if (!uploading) {
            setMediaUrl('');
            setError(null);
            setUploadProgress(0);
            setUploadSuccess(false);
            onOpenChange(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        setUploadProgress(0);
        setUploading(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        {existingMediaUrl ? 'Update Media Link' : 'Add Media Link (Required)'}
                    </DialogTitle>
                    <DialogDescription>
                        {existingMediaUrl ? 'Update' : 'Add'} supporting media for: <strong>{issueTitle}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Show existing media if available */}
                    {existingMediaUrl && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <div className="space-y-1">
                                    <p className="font-medium">Existing Media Found</p>
                                    <p className="text-xs break-all">{existingMediaUrl}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="media-url" className="text-sm font-semibold">
                            {existingMediaUrl ? 'Update Media URL' : 'Enter Media URL'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="media-url"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                disabled={uploading || uploadSuccess}
                                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                            />
                            <Button
                                onClick={handleUrlSubmit}
                                disabled={uploading || uploadSuccess || !mediaUrl.trim()}
                                size="sm"
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                            </Button>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Uploading...</span>
                                <span className="font-medium">{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {uploadSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Media uploaded successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <span>{error}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRetry}
                                    className="h-6 text-xs"
                                >
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
