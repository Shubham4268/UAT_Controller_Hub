/**
 * Enhanced duplicate detection service with scoring system.
 * Designed for easy replacement with AI model.
 * 
 * Scoring System:
 * - Exact title match: 100 points
 * - Same module + similar description: 80 points
 * - Title word overlap (>50%): 60 points
 * - Threshold for duplicate: 60+ points
 */

export interface DuplicateMatch {
    issue: any;
    score: number;
    reasons: string[];
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    matches: DuplicateMatch[];
    confidenceScore: number; // 0-100
}

/**
 * Main duplicate detection function.
 * Can be replaced with AI model call in the future.
 */
export function detectDuplicates(currentIssue: any, previousIssues: any[]): DuplicateCheckResult {
    const matches: DuplicateMatch[] = [];

    for (const prevIssue of previousIssues) {
        const result = calculateDuplicateScore(currentIssue, prevIssue);
        if (result.score >= 60) {
            matches.push(result);
        }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return {
        isDuplicate: matches.length > 0,
        matches,
        confidenceScore: matches.length > 0 ? matches[0].score : 0
    };
}

/**
 * Calculate duplicate score between two issues.
 * This is the core logic that can be replaced with AI.
 */
function calculateDuplicateScore(current: any, previous: any): DuplicateMatch {
    let score = 0;
    const reasons: string[] = [];

    // 1. Exact title match (100 points)
    if (normalizeText(current.title) === normalizeText(previous.title)) {
        score = 100;
        reasons.push('Identical title');
        return { issue: previous, score, reasons };
    }

    // 2. Same module + similar description (80 points)
    const currentModule = current.dynamicData?.module;
    const prevModule = previous.dynamicData?.module;
    
    if (currentModule && prevModule && currentModule === prevModule) {
        const descSimilarity = calculateDescriptionSimilarity(
            current.description,
            previous.description
        );
        
        if (descSimilarity > 0.7) {
            score = 80;
            reasons.push('Same module with similar description');
        } else if (descSimilarity > 0.5) {
            score = 65;
            reasons.push('Same module with moderately similar description');
        }
    }

    // 3. Title word overlap (60-75 points based on overlap percentage)
    const titleOverlap = calculateTitleOverlap(current.title, previous.title);
    if (titleOverlap > 0.7) {
        const overlapScore = Math.round(60 + (titleOverlap - 0.7) * 50);
        if (overlapScore > score) {
            score = overlapScore;
            reasons.push(`${Math.round(titleOverlap * 100)}% title word overlap`);
        }
    } else if (titleOverlap > 0.5 && score < 60) {
        score = Math.round(50 + (titleOverlap - 0.5) * 50);
        reasons.push(`${Math.round(titleOverlap * 100)}% title word overlap`);
    }

    return { issue: previous, score, reasons };
}

/**
 * Calculate similarity between two descriptions.
 * Returns a score between 0 and 1.
 */
function calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    const normalized1 = normalizeText(desc1);
    const normalized2 = normalizeText(desc2);

    // Exact match
    if (normalized1 === normalized2) return 1.0;

    // One contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        const shorter = Math.min(normalized1.length, normalized2.length);
        const longer = Math.max(normalized1.length, normalized2.length);
        return shorter / longer;
    }

    // Check first 50 characters similarity
    const prefix1 = normalized1.substring(0, 50);
    const prefix2 = normalized2.substring(0, 50);
    if (prefix1 === prefix2 && prefix1.length > 10) {
        return 0.8;
    }

    // Word-based similarity
    const words1 = normalized1.split(/\s+/).filter(w => w.length > 3);
    const words2 = normalized2.split(/\s+/).filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
}

/**
 * Calculate title word overlap percentage.
 * Returns a score between 0 and 1.
 */
function calculateTitleOverlap(title1: string, title2: string): number {
    const words1 = normalizeText(title1).split(/\s+/).filter(w => w.length > 3);
    const words2 = normalizeText(title2).split(/\s+/).filter(w => w.length > 3);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(w => words2.includes(w));
    const totalUniqueWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalUniqueWords;
}

/**
 * Normalize text for comparison.
 */
function normalizeText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Future AI integration point.
 * Replace detectDuplicates function with this when AI is ready.
 */
export async function detectDuplicatesWithAI(
    currentIssue: any,
    previousIssues: any[]
): Promise<DuplicateCheckResult> {
    // TODO: Implement AI model call
    // For now, fall back to rule-based detection
    return detectDuplicates(currentIssue, previousIssues);
}
