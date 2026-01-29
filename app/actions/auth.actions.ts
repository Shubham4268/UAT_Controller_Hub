'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Logout user by clearing auth cookie and redirecting to login
 */
export async function logout() {
  const cookieStore = await cookies();

  // Delete the auth token cookie
  cookieStore.delete('auth-token');

  // Redirect to login page
  redirect('/login');
}
