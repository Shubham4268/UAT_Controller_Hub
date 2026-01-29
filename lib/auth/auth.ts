import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';

export type AuthUser = {
  userId: string;
  role: string;
  username: string; // Added for display
  name: string; // Added for display
  // Add more fields if needed
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  return verifyJWT<AuthUser>(token);
}

// Helper to set cookie (useful in actions/routes)
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours - match JWT_EXPIRES_IN ideally
  });
}
