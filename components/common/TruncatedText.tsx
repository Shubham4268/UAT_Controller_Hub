'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TruncatedTextProps {
    text: string;
    maxLength?: number;
    maxWidth?: string;
    className?: string;
    showTooltip?: boolean;
}

/**
 * TruncatedText Component
 * 
 * Displays text with truncation and optional tooltip showing full content on hover.
 * 
 * @param text - The text to display
 * @param maxLength - Maximum character length before truncation (default: 50)
 * @param maxWidth - CSS class for maximum width (default: 'max-w-[200px]')
 * @param className - Additional CSS classes
 * @param showTooltip - Whether to show tooltip on hover (default: true)
 */
export function TruncatedText({
    text,
    maxLength = 50,
    maxWidth = 'max-w-[200px]',
    className = '',
    showTooltip = true,
}: TruncatedTextProps) {
    // Handle empty or null text
    if (!text) {
        return <span className={className}>—</span>;
    }

    const isTruncated = text.length > maxLength;

    // If text is short or tooltip is disabled, just show the text
    if (!showTooltip || !isTruncated) {
        return (
            <span className={`${maxWidth} truncate block ${className}`}>
                {text}
            </span>
        );
    }

    // Show truncated text with tooltip
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`${maxWidth} truncate block cursor-help ${className}`}>
                        {text}
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    className="max-w-[400px] break-words"
                    side="top"
                    sideOffset={5}
                >
                    <p className="whitespace-pre-wrap">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
