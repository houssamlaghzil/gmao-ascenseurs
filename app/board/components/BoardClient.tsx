'use client';

/**
 * Board Kanban - Client Component (temporaire)
 * Version simplifiée en attendant l'implémentation complète du drag & drop
 */

import { Ascenseur, ParcAscenseurs, Technicien, EtatGlobal, RiskScore } from '@/domain/types';
import StatusBadge from '@/components/StatusBadgeNew';
import RiskBadge from '@/components/RiskBadge';

interface BoardClientProps {
  initialAscenseurs: Array<Ascenseur & { riskScore: RiskScore }>;
  parcs: ParcAscenseurs[];
  techniciens: Technicien[];
}

export default function BoardClient({
  initialAscenseurs,
  parcs,
  techniciens,
}: BoardClientProps) {
  // Grouper les ascenseurs par état
  const fonctionnels = initialAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.FONCTIONNEL);
  const enPanne = initialAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_PANNE);
  const enReparation = initialAscenseurs.filter((a) => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION);

  const getColumnStyle = (count: number) => {
    return `bg-white rounded-lg border-2 border-gray-200 p-4`;
  };

  const renderAscenseurCard = (asc: Ascenseur & { riskScore: RiskScore }) => {
    const parc = parcs.find((p) => p.id === asc.parcId);
    
    return (
      <div
        key={asc.id}
        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{asc.nom}</h3>
          <StatusBadge etatGlobal={asc.etatGlobal} sousEtatPanne={asc.sousEtatPanne} />
        </div>
        
        {parc && (
          <p className="text-xs text-gray-600 mb-2">
            {parc.nom} - {parc.ville}
          </p>
        )}
        
        {asc.referenceTechnique && (
          <p className="text-xs text-gray-500 mb-2">Réf: {asc.referenceTechnique}</p>
        )}
        
        <RiskBadge riskScore={asc.riskScore} showScore={true} className="mb-2" />
        
        {asc.technicienAttribueId && (
          <p className="text-xs text-gray-600 mt-2">
            👤 Technicien: {asc.technicienAttribueId}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Colonne Fonctionnels */}
      <div className={getColumnStyle(fonctionnels.length)}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            Fonctionnels
          </h2>
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {fonctionnels.length}
          </span>
        </div>
        <div className="space-y-3">
          {fonctionnels.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun ascenseur</p>
          ) : (
            fonctionnels.map(renderAscenseurCard)
          )}
        </div>
      </div>

      {/* Colonne En Panne */}
      <div className={getColumnStyle(enPanne.length)}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500"></span>
            En Panne
          </h2>
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {enPanne.length}
          </span>
        </div>
        <div className="space-y-3">
          {enPanne.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun ascenseur</p>
          ) : (
            enPanne.map(renderAscenseurCard)
          )}
        </div>
      </div>

      {/* Colonne En Réparation */}
      <div className={getColumnStyle(enReparation.length)}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-cyan-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-cyan-500"></span>
            En Réparation
          </h2>
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {enReparation.length}
          </span>
        </div>
        <div className="space-y-3">
          {enReparation.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun ascenseur</p>
          ) : (
            enReparation.map(renderAscenseurCard)
          )}
        </div>
      </div>
    </div>
  );
}
