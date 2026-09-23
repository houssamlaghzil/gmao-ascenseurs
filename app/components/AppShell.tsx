'use client';

/**
 * Coquille de l'application : barre latérale + contenu pour les pages Web,
 * plein écran neutre pour les pages sous /mobile (simulation de l'app
 * technicien, rendue dans un cadre téléphone par app/mobile/layout.tsx).
 */

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import BandeauMaquette from './BandeauMaquette';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobileSimulation = pathname?.startsWith('/mobile');

  if (isMobileSimulation) {
    return (
      <div className="min-h-screen bg-gray-100">
        <BandeauMaquette />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="md:pl-60">
        <BandeauMaquette />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
