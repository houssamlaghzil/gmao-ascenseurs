/**
 * Composant pour afficher les messages d'erreur
 */

import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Erreur</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
