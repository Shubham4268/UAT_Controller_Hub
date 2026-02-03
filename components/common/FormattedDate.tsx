'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
    date: Date | string | number;
    type?: 'date' | 'time' | 'both';
    options?: Intl.DateTimeFormatOptions;
}

/**
 * A component that safely renders a locale-dependent date string.
 * It prevents hydration mismatches by only rendering the locale string on the client.
 */
export function FormattedDate({ date, type = 'both', options }: FormattedDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Fallback/SSR content
    if (!mounted) {
        return <span className="opacity-0">{dateObj.toISOString().split('T')[0]}</span>;
    }

    let formattedValue = '';
    try {
        if (type === 'date') {
            formattedValue = dateObj.toLocaleDateString(undefined, options);
        } else if (type === 'time') {
            formattedValue = dateObj.toLocaleTimeString(undefined, options);
        } else {
            formattedValue = dateObj.toLocaleString(undefined, options);
        }
    } catch (e) {
        formattedValue = dateObj.toISOString();
    }

    return <span>{formattedValue}</span>;
}
