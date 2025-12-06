import { useEffect } from 'react';

export const useLogger = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Log to your preferred logging service (e.g. Sentry, console, backend API)
      console.error('[Global Error]:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Rejection]:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};
