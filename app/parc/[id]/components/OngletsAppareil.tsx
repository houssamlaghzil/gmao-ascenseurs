'use client';

/**
 * Composant à onglets de la fiche appareil (section 4.2) — pas de
 * sous-navigation profonde, un simple bandeau d'onglets. Le contenu de
 * chaque onglet est déjà calculé côté serveur par la page (Server
 * Component) et transmis tel quel ; ce composant ne fait que gérer
 * l'onglet actif.
 */

import { ReactNode, useState } from 'react';

export interface OngletAppareil {
  id: string;
  label: string;
  content: ReactNode;
}

export default function OngletsAppareil({ tabs }: { tabs: OngletAppareil[] }) {
  const [actifId, setActifId] = useState(tabs[0]?.id);
  const onglet = tabs.find((t) => t.id === actifId) ?? tabs[0];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActifId(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                tab.id === onglet?.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">{onglet?.content}</div>
    </div>
  );
}
