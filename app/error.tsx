'use client';

/**
 * Page d'erreur globale
 */

import { useEffect } from 'react';
import ErrorMessage from '@/components/ErrorMessage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur application:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Une erreur est survenue
        </h1>
        <ErrorMessage
          message={error.message || 'Erreur inconnue'}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
