'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
    'dashboard': 'Dashboard',
    'lead': 'Lead',
    'tester': 'Tester',
    'admin': 'Admin',
    'activities': 'Activities',
    'sessions': 'Sessions',
    'issues': 'Issues',
    'validate': 'Validation',
    'profile': 'Profile',
    'team': 'Team',
    'data': 'Data',
    'settings': 'Settings',
    'members': 'Members',
    'add': 'Create New',
    'edit': 'Edit',
    'view': 'View Details',
    'projects': 'Projects',
    'test-cycle': 'Test Cycle'
};

// Overrides for specific path combinations
const PATH_OVERRIDES: Record<string, string> = {
    // Lead routes
    '/lead/dashboard': 'Lead Dashboard',
    '/lead/activities': 'Manage Activities',
    '/lead/my-activities': 'My Activities',

    // Tester routes
    '/tester/activities': 'My Activities',
    '/tester/profile': 'My Profile',

    // Admin routes
    '/admin': 'Admin Dashboard',
    '/admin/activities': 'Manage Activities',
    '/admin/team': 'Team Management',
    '/admin/settings': 'Settings',
    '/admin/data': 'Data Management',

    // Common routes
    '/dashboard': 'Dashboard',
    '/team': 'Team',
    '/activities': 'Activities',
    '/members': 'Members'
};

export function Breadcrumbs() {
    const pathname = usePathname();

    // Don't show breadcrumbs on login or home
    if (!pathname || pathname === '/' || pathname === '/login') return null;

    const segments = pathname.split('/').filter(Boolean);

    const breadcrumbs = segments.reduce((acc: any[], segment, index) => {
        let path = `/${segments.slice(0, index + 1).join('/')}`;

        // Skip some segments that are just grouping or redundant
        if (segment === '(app)' || segment === 'tester' || segment === 'lead') return acc;

        let label = ROUTE_LABELS[segment] || segment;

        // Check for path overrides
        if (PATH_OVERRIDES[path]) {
            label = PATH_OVERRIDES[path];
        }

        // Special handling for the lead validation flow to keep it consistent with the activity details page
        if (path.startsWith('/lead/sessions')) {
            // Map 'sessions' to 'Manage Activities' and link to the activities list
            if (segment === 'sessions') {
                label = 'Manage Activities';
                path = '/lead/activities';
            }
            // Map session ID to 'Issues' and link to the activity detail page
            const isSessionId = index === 2 && /^[0-9a-fA-F]{24}$/.test(segment);
            if (isSessionId) {
                label = 'Issues';
                path = `/lead/activities/${segment}`;
            }
            // Skip the redundant 'issues' and 'issueId' segments in the breadcrumb trail
            if (segment === 'issues' || (index === 4 && /^[0-9a-fA-F]{24}$/.test(segment))) {
                return acc;
            }
        }

        // Handle IDs (MongoDB style) for generic labeling if not already handled
        const isId = /^[0-9a-fA-F]{24}$/.test(segment);
        if (isId && label === segment) {
            // Determine label based on preceding segment
            const prevSegment = segments[index - 1];
            if (prevSegment === 'activities' || prevSegment === 'sessions') {
                label = 'Activity Details';
            } else if (prevSegment === 'issues') {
                label = 'Issue Details';
            } else if (prevSegment === 'team') {
                label = 'Member Details';
            } else {
                label = 'Details';
            }
        }

        // Avoid adding the same label/path twice if they get mapped to already added parent paths
        const isDuplicate = acc.some(b => b.path === path);
        if (!isDuplicate) {
            acc.push({ label, path });
        }
        return acc;
    }, []);

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-muted-foreground">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-primary transition-colors duration-200"
                    >
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>

                {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={breadcrumb.path} className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
                            {isLast ? (
                                <span className="text-foreground font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                                    {breadcrumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={breadcrumb.path}
                                    className="hover:text-primary transition-colors duration-200 truncate max-w-[80px] sm:max-w-[150px]"
                                >
                                    {breadcrumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
