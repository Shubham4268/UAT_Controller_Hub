import { z } from 'zod';

/**
 * Centralized validation schemas for consistent validation across the application.
 * These schemas can be reused in forms and API endpoints.
 */

// ============================================================================
// TEXT FIELD VALIDATORS
// ============================================================================

/**
 * Title field validation
 * Used for: Issue titles, session titles, activity titles
 */
export const titleSchema = z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be under 100 characters')
    .trim()
    .refine((val) => val.length > 0, 'Title cannot be empty or just whitespace');

/**
 * Description field validation
 * Used for: Issue descriptions, session descriptions, activity descriptions
 */
export const descriptionSchema = z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be under 2000 characters')
    .trim()
    .refine((val) => val.length > 0, 'Description cannot be empty or just whitespace');

/**
 * Short description field validation
 * Used for: Brief descriptions, notes
 */
export const shortDescriptionSchema = z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be under 500 characters')
    .trim();

/**
 * Comment field validation
 * Used for: Lead comments, tester comments, general comments
 */
export const commentSchema = z
    .string()
    .max(1000, 'Comment must be under 1000 characters')
    .trim()
    .optional();

/**
 * Required comment field validation
 * Used for: Mandatory comments (e.g., NA justification, edit requests)
 */
export const requiredCommentSchema = z
    .string()
    .min(1, 'Comment is required')
    .max(1000, 'Comment must be under 1000 characters')
    .trim()
    .refine((val) => val.length > 0, 'Comment cannot be empty or just whitespace');

/**
 * Device details field validation
 * Used for: Device information in issue reports
 */
export const deviceDetailsSchema = z
    .string()
    .min(1, 'Device details are required')
    .max(100, 'Device details must be under 100 characters')
    .trim();

/**
 * OS version field validation
 * Used for: Operating system version in issue reports
 */
export const osVersionSchema = z
    .string()
    .min(1, 'OS version is required')
    .max(50, 'OS version must be under 50 characters')
    .trim();

/**
 * Name field validation
 * Used for: User names, team member names
 */
export const nameSchema = z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be under 50 characters')
    .trim()
    .refine((val) => val.length > 0, 'Name cannot be empty or just whitespace');

// ============================================================================
// CREDENTIAL VALIDATORS
// ============================================================================

/**
 * Email field validation
 * Used for: User emails, login emails
 */
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .max(100, 'Email must be under 100 characters');

/**
 * Username field validation
 * Used for: User usernames, login usernames
 */
export const usernameSchema = z
    .string()
    .min(1, 'Username is required')
    .regex(
        /^[A-Za-z0-9]+\.[A-Za-z0-9]+$/,
        'Username must be in format First.Last (letters and numbers allowed, e.g., John1.Doe2)'
    )


/**
 * Password field validation
 * Used for: User passwords, login passwords
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be under 100 characters');

// ============================================================================
// URL VALIDATORS
// ============================================================================

/**
 * General URL field validation
 * Used for: Generic URL inputs
 */
export const urlSchema = z
    .string()
    .url('Invalid URL format')
    .regex(/^https?:\/\//, 'URL must start with http:// or https://')
    .max(500, 'URL must be under 500 characters')
    .optional()
    .or(z.literal(''));

/**
 * Media URL field validation with format checking
 * Used for: Issue media uploads, screenshots, videos
 * Supports: Images (jpg, jpeg, png, gif, webp, svg, bmp)
 *          Videos (mp4, webm, ogg, mov)
 *          Audio (mp3, wav)
 *          Cloud platforms (Google Drive, Dropbox, Imgur, Cloudinary)
 */
export const mediaUrlSchema = z
    .string()
    .url('Invalid media URL format')
    .regex(/^https:\/\//, 'Media URL must start with https://')
    .max(500, 'Media URL must be under 500 characters')
    .optional()
    .or(z.literal(''));

/**
 * App link field validation
 * Used for: Android/iOS app download links
 */
export const appLinkSchema = z
    .string()
    .url('Invalid app link format')
    .regex(/^https?:\/\//, 'App link must start with http:// or https://')
    .max(500, 'App link must be under 500 characters')
    .optional()
    .or(z.literal(''));

// ============================================================================
// SELECTION VALIDATORS
// ============================================================================

/**
 * Scope field validation
 * Used for: Test session scope selection
 */
export const scopeSchema = z.enum(['UI', 'Functional', 'Both']);

/**
 * Severity field validation
 * Used for: Issue severity levels
 */
export const severitySchema = z.enum(['Blocker', 'Critical', 'Major', 'Normal', 'Minor', 'NA']);

/**
 * Priority field validation
 * Used for: Issue priority levels
 */
export const prioritySchema = z.enum(['P0', 'P1', 'P2', 'P3']);

/**
 * Role field validation
 * Used for: User role selection
 */
export const roleSchema = z.enum(['admin', 'lead', 'tester', 'member']);

/**
 * Status field validation
 * Used for: Issue status
 */
export const issueStatusSchema = z.enum(
    ['NOT_VALIDATED', 'VALIDATED', 'NA', 'REVIEW_REQUESTED', 'REVIEWED', 'EDITED']
);

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
});

/**
 * Issue submission form schema (basic fields)
 */
export const issueSubmissionSchema = z.object({
    title: titleSchema,
    description: descriptionSchema,
    deviceDetails: deviceDetailsSchema,
    osVersion: osVersionSchema,
    media: mediaUrlSchema,
});

/**
 * Test session creation schema
 */
export const testSessionSchema = z.object({
    title: titleSchema,
    description: descriptionSchema,
    scope: scopeSchema,
    androidAppLink: appLinkSchema,
    iosAppLink: appLinkSchema,
});

/**
 * User creation schema
 */
export const userCreationSchema = z.object({
    name: nameSchema,
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
});

/**
 * User update schema (password optional)
 */
export const userUpdateSchema = z.object({
    name: nameSchema,
    username: usernameSchema,
    email: emailSchema,
    role: roleSchema,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .slice(0, 10000); // Hard limit
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('Invalid protocol');
        }
        return url.trim();
    } catch {
        return '';
    }
}
