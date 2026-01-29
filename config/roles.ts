export const ROLES = {
    ADMIN: 'admin',
    LEAD: 'lead',
    TESTER: 'tester',
    MANAGER: 'manager',
    MEMBER: 'member',
    GUEST: 'guest',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
