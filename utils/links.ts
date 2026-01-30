import crypto from 'crypto';

/**
 * Generates a random alphanumeric token for session identification.
 * @param length Length of the token.
 * @returns A random token string.
 */
export function generateSessionToken(length = 16): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generates QR code URLs for iOS and Android.
 * Uses api.qrserver.com for dynamic generation.
 * @param url The target URL for the QR code.
 * @returns The QR code image URL.
 */
export function generateQRCodeUrl(url: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}

/**
 * Constructs test session links for iOS and Android.
 * @param token Unique session token.
 * @returns An object containing ios and android links.
 */
export function constructSessionLinks(token: string) {
    // Use environment variable or default to localhost for development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
        ios: `${baseUrl}/tester/session/${token}?platform=ios`,
        android: `${baseUrl}/tester/session/${token}?platform=android`,
    };
}
