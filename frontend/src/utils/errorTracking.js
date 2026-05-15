import * as Sentry from '@sentry/react';

export function initErrorTracking() {
    if (process.env.NODE_ENV === 'production') {
        Sentry.init({
            dsn: 'https://9e51d071142747ea8a48dd5661b97389@ed-space.ru/api/1/store/',
            environment: 'production',
            tracesSampleRate: 0.3,
            beforeSend(event) {
                if (window.location.hostname === 'localhost') return null;
                return event;
            },
        });
    }
}