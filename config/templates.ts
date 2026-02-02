export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'url';

export interface TemplateField {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For 'select' type
}

export interface IssueTemplate {
    id: string;
    name: string;
    fields: TemplateField[];
}

export const PREDEFINED_TEMPLATES: IssueTemplate[] = [
    {
        id: 'jio_join',
        name: 'Jio Join',
        fields: [
            { key: 'title', label: 'Issue Title', type: 'text', required: true },
            { key: 'description', label: 'Issue Description', type: 'textarea', required: true },
            { key: 'steps', label: 'Issue Steps', type: 'textarea', required: true },
            { key: 'expectedOutcome', label: 'Expected Outcome', type: 'textarea', required: true },
            { key: 'userType', label: 'User Type', type: 'select', required: true, options: ['Caller', 'Receiver', 'Both'] },
            { key: 'whitelistedNo', label: 'Whitelisted No', type: 'text', required: true },
            { key: 'jioJoinVersion', label: 'Jio Join Version', type: 'text', required: true },
            { key: 'replicable', label: 'Replicable', type: 'select', required: true, options: ['Always', 'Intermittent'] },
            { key: 'timestamp', label: 'Timestamp', type: 'text', placeholder: 'YYYY-MM-DD HH:mm', required: true },
            { key: 'media', label: 'Media', type: 'url', placeholder: 'Optional URL' }
        ]
    },
    {
        id: 'app_revamp',
        name: 'App Revamp',
        fields: [
            { key: 'module', label: 'Module', type: 'text', required: true },
            { key: 'title', label: 'Issue Title', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'textarea', required: true },
            // Priority is disabled for tester, so excluded from form
            { key: 'media', label: 'Media', type: 'url', placeholder: 'Optional URL' }
        ]
    },
    {
        id: 'mpc',
        name: 'MPC',
        fields: [
            { key: 'loginType', label: 'Login', type: 'select', required: true, options: ['Citizen', 'MP', 'SL', 'Admin'] },
            { key: 'title', label: 'Issue Title', type: 'text', required: true },
            // Mapping 'Steps' to description core field for better visibility in main table, 
            // since MPC has no explicit description field in the request.
            { key: 'description', label: 'Steps', type: 'textarea', required: true },
            { key: 'media', label: 'Media', type: 'url', placeholder: 'Optional URL' }
        ]
    }
];

export const DEFAULT_CUSTOM_FIELDS: TemplateField[] = [
    { key: 'title', label: 'Issue Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Blocker', 'Critical', 'Major', 'Normal', 'Minor'] },
    { key: 'media', label: 'Media URL', type: 'url' }
];
