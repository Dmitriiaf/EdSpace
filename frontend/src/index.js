import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';

Sentry.init({
  dsn: "https://9e51d071142747ea8a48dd5661b97389@ed-space.ru/monitoring/1",
  tracesSampleRate: 0.01,
  autoSessionTracking: false,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);