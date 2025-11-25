'use client';

/**
 * Onglet affichant la liste des ascenseurs du parc
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadgeNew';
import { EtatGlobal, Ascenseur } from '@/domain/types';
import { Filter, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AscenseursTabProps {
  ascenseurs: Ascenseur[];
  parcId: string;
}

type FilterType = 'tous' | 'fonctionnel' | 'en_panne' | 'en_cours_de_reparation';

export default function AscenseursTab({ ascenseurs, parcId }: AscenseursTabProps) {
  const [filter, setFilter] = useState<FilterType>('tous');
  const router = useRouter();

  const filteredAscenseurs = ascenseurs.filter((asc) => {
    if (filter === 'tous') return true;
    return asc.etatGlobal === filter;
  });

  const filterButtons: { label: string; value: FilterType; count: number }[] = [
    { label: 'Tous', value: 'tous', count: ascenseurs.length },
    {
      label: 'Fonctionnels',
      value: 'fonctionnel',
      count: ascenseurs.filter((a) => a.etatGlobal === EtatGlobal.FONCTIONNEL).length,
    },
    {
      label: 'En panne',
      value: 'en_panne',
      count: ascenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_PANNE).length,
    },
    {
      label: 'En réparation',
      value: 'en_cours_de_reparation',
      count: ascenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION).length,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Filtres */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtrer:</span>
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${
                  filter === btn.value
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des ascenseurs */}
      <div className="divide-y divide-gray-200">
        {filteredAscenseurs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun ascenseur trouvé avec ce filtre</p>
          </div>
        ) : (
          filteredAscenseurs.map((asc) => (
            <div
              key={asc.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {asc.nom}
                    </h3>
                    <StatusBadge etatGlobal={asc.etatGlobal} sousEtatPanne={asc.sousEtatPanne} />
                  </div>
                  {asc.referenceTechnique && (
                    <p className="text-sm text-gray-500 mt-1">
                      Réf: {asc.referenceTechnique}
                    </p>
                  )}
                  {asc.technicienAttribueId && (
                    <p className="text-sm text-gray-600 mt-2">
                      Technicien: {asc.technicienAttribueId}
                    </p>
                  )}
                </div>
                <Link href={`/ascenseurs/${asc.id}`}>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    <Eye className="h-4 w-4" />
                    <span>Voir détails</span>
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
