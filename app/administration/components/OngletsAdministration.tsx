'use client';

/**
 * Composant à onglets de l'écran Administration (section 17) : le cahier des
 * charges demande d'éviter les sous-menus profonds, donc une seule page
 * avec des onglets côté client plutôt que des sous-routes — même
 * convention que app/techniciens/[id]/components/OngletsTechnicien.tsx. Le
 * contenu de chaque onglet reste rendu côté serveur (les jointures ont déjà
 * eu lieu dans app/administration/page.tsx) et n'est que transmis ici.
 */

import { ReactNode, useState } from 'react';

export interface OngletAdministration {
  id: string;
  label: string;
  content: ReactNode;
}

interface OngletsAdministrationProps {
  tabs: OngletAdministration[];
}

export default function OngletsAdministration({ tabs }: OngletsAdministrationProps) {
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
