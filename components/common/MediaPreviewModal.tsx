import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface MediaPreviewModalProps {
    url: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MediaPreviewModal({ url, open, onOpenChange }: MediaPreviewModalProps) {
    const [error, setError] = useState(false);

    if (!url) return null;

    const getMediaType = (url: string) => {
        try {
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
            if (lowerUrl.includes('sharepoint.com') || lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('1drv.ms')) return 'microsoft';

            // Handles cases with query parameters e.g. .mp4?token=...
            const cleanUrl = url.split(/[?#]/)[0];
            const extension = cleanUrl.split('.').pop()?.toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension || '')) return 'image';
            if (['mp4', 'webm', 'mov', 'ogg'].includes(extension || '')) return 'video';
            if (['mp3', 'wav', 'aac'].includes(extension || '')) return 'audio';
        } catch (e) {
            console.error(e);
        }
        return 'other';
    };

    const getYoutubeEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtu.be')) {
                videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
            } else if (url.includes('youtube.com/watch')) {
                const params = new URLSearchParams(url.split('?')[1]);
                videoId = params.get('v') || '';
            } else if (url.includes('youtube.com/embed/')) {
                return url;
            }
            
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
        } catch (e) {
            console.error('Error parsing YouTube URL', e);
        }
        return url;
    };

    const type = getMediaType(url);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-black/95 border-neutral-800">
                <DialogHeader className="p-4 flex-row items-center justify-between absolute w-full z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                     {/* Close button is automatically added by DialogContent, we just need the title for accessibility if needed, currently visually hidden or custom */}
                    <DialogTitle className="sr-only">Media Preview</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex items-center justify-center min-h-[500px] w-full relative">
                    {error ? (
                        <div className="text-white flex flex-col items-center gap-4">
                            <p>Failed to load media.</p>
                            <Button variant="outline" onClick={() => window.open(url, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in New Tab
                            </Button>
                        </div>
                    ) : (
                        <>
                            {type === 'image' && (
                                <img
                                    src={url}
                                    alt="Preview"
                                    className="max-w-full max-h-[85vh] object-contain"
                                    onError={() => setError(true)}
                                />
                            )}
                            {type === 'video' && (
                                <video
                                    controls
                                    autoPlay
                                    src={url}
                                    className="max-w-full max-h-[85vh]"
                                    onError={() => setError(true)}
                                />
                            )}
                            {type === 'audio' && (
                                <audio
                                    controls
                                    autoPlay
                                    src={url}
                                    className="w-full max-w-md"
                                    onError={() => setError(true)}
                                />
                            )}
                            {type === 'microsoft' && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-white">
                                    <p className="text-center">Microsoft SharePoint / OneDrive content cannot be embedded directly.</p>
                                    <Button variant="outline" className="bg-white text-black hover:bg-white/90" onClick={() => window.open(url, '_blank')}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open in New Tab
                                    </Button>
                                </div>
                            )}
                            {(type === 'youtube' || type === 'other') && (
                                <div className="w-full h-full bg-white">
                                    <iframe 
                                        src={type === 'youtube' ? getYoutubeEmbedUrl(url) : url} 
                                        className="w-full h-full" 
                                        onError={() => setError(true)}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-white/10 flex justify-between items-center text-white/70 text-sm">
                    <span className="truncate max-w-[80%]">{url.split('/').pop()}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-white/20"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Original
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
