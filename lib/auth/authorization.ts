import { getAuthUser, type AuthUser } from './auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/config/roles';

/**
 * Authorization error for server actions
 * Includes status code for proper HTTP responses
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public status: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Require user to be authenticated
 * Throws AuthorizationError if not authenticated
 * @returns Authenticated user
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) {
    throw new AuthorizationError('Unauthorized: Please log in', 401);
  }

  return user;
}

/**
 * Require user to be an admin
 * Throws AuthorizationError if not authenticated or not an admin
 * @returns Authenticated admin user
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== 'admin') {
    throw new AuthorizationError('Forbidden: Admin access required', 403);
  }

  return user;
}

/**
 * Require user to be a lead
 * Throws AuthorizationError if not authenticated or not a lead
 * @returns Authenticated lead user
 */
export async function requireLead(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== ROLES.LEAD && user.role !== ROLES.ADMIN) {
    throw new AuthorizationError('Forbidden: Lead access required', 403);
  }

  return user;
}

/**
 * Require user to be a tester
 * Throws AuthorizationError if not authenticated or not a tester
 * @returns Authenticated tester user
 */
export async function requireTester(): Promise<AuthUser> {
  const user = await requireAuth();

  // Assuming testers are the base role for this context, but strict check:
  if (user.role !== ROLES.TESTER && user.role !== ROLES.ADMIN && user.role !== ROLES.LEAD) {
    // Hierarchy: Admin > Lead > Tester? Or are they distinct?
    // For now, let's treat them as distinct but Admin usually has all access.
    // However, typically RBAC implies specific checks.
    // If the prompt implies hierarchy, we should adjust.
    // "Roles should be reusable across the application for authorization checks."
    // Let's stick to strict role check OR admin override for safety.

    // Re-reading: "Lead (creating/managing test sessions) and Tester (joining sessions)".
    // Test activity platform.
    // A Lead probably shouldn't be a Tester in the same session, or maybe they can.
    // Let's keep it simple: Require specific role OR Admin.
  }

  // Implementation note: The above commented thought process.
  // Let's Implement strict checks for now + Admin superuser.

  if (user.role !== ROLES.TESTER && user.role !== ROLES.ADMIN) {
    throw new AuthorizationError('Forbidden: Tester access required', 403);
  }

  return user;
}

/**
 * Check if current user is admin
 * Returns boolean without throwing
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === ROLES.ADMIN;
}

export async function isLead(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === ROLES.LEAD;
}

export async function isTester(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === ROLES.TESTER;
}

/**
 * Require admin access for pages
 * Redirects to login if not authenticated or not admin
 * Use in Server Components
 */
export async function requireAdminPage(): Promise<AuthUser> {
  try {
    return await requireAdmin();
  } catch (error) {
    // For pages, redirect instead of throwing
    if (error instanceof AuthorizationError) {
      if (error.status === 401) {
        redirect('/login');
      } else {
        redirect('/'); // Redirect non-admins to home
      }
    }
    throw error;
  }
}
