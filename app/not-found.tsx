/**
 * Page 404 personnalisée
 */

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page non trouvée
        </h2>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Home className="h-5 w-5" />
          <span>Retour au Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
