'use client';

/**
 * Ligne technicien du planning (section 11.1) — zone de dépôt (useDroppable,
 * section 11.2) pour toutes les tâches de ce technicien sur la période
 * affichée. Le dépôt reste au niveau du technicien (pas d'une date précise) :
 * glisser une carte dans cette ligne réaffecte la tâche à ce technicien sans
 * changer sa date, conformément à app/planning/actions.ts.
 */

import Link from 'next/link';
import { useDroppable } from '@dnd-kit/core';
import type { LignePlanningTechnicien } from '@/lib/derived/planning';
import { LienTechnicien } from '@/components/Liens';
import TacheCard from './TacheCard';

export default function TechnicienRow({ ligne }: { ligne: LignePlanningTechnicien }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `row-${ligne.technicien.id}`,
    data: { technicienId: ligne.technicien.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border shadow-sm p-3 transition-colors ${isOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/techniciens/${ligne.technicien.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline truncate">
              {ligne.technicien.nomComplet}
            </Link>
            {/* Demande explicite du client : depuis le planning, voir l'ensemble des appareils de la juridiction du technicien et leur état. */}
            <LienTechnicien id={ligne.technicien.id} ton="sobre" className="text-[11px] font-normal">
              Voir ses appareils
            </LienTechnicien>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {ligne.tourneeNom ?? 'Sans tournée'}
            {ligne.secteurNom ? ` · ${ligne.secteurNom}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {ligne.taches.length} tâche{ligne.taches.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[56px]">
        {ligne.taches.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-3">Aucune tâche sur la période</p>
        ) : (
          ligne.taches.map((tache) => <TacheCard key={tache.id} tache={tache} />)
        )}
      </div>
    </div>
  );
}
