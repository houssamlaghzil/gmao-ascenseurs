'use client';

/**
 * Composant à onglets de la fiche technicien (section 12) — même convention
 * que app/parc/[id]/components/OngletsAppareil.tsx, avec un onglet initial
 * piloté par le query param `onglet` : nécessaire ici car l'onglet
 * Maintenances est paginé (jusqu'à plusieurs milliers d'occurrences pour un
 * technicien titulaire d'une grande tournée) et doit donc rester sélectionné
 * après un changement de page (Link, rechargement serveur).
 */

import { ReactNode, useState } from 'react';

export interface OngletTechnicien {
  id: string;
  label: string;
  content: ReactNode;
}

interface OngletsTechnicienProps {
  ongletInitial: string;
  tabs: OngletTechnicien[];
}

export default function OngletsTechnicien({ ongletInitial, tabs }: OngletsTechnicienProps) {
  const [actifId, setActifId] = useState(tabs.some((t) => t.id === ongletInitial) ? ongletInitial : tabs[0]?.id);
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
