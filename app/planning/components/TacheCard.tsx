'use client';

/**
 * Carte d'une tâche du planning (section 11.1) — draggable via useDraggable
 * (section 11.2), sauf pour une absence : une absence n'est pas une charge
 * de travail déplaçable, elle reste affichée mais non glissable (voir
 * app/planning/actions.ts).
 *
 * `TacheCardContenu` est le rendu purement visuel, réutilisé tel quel par le
 * DragOverlay (app/planning/components/PlanningBoard.tsx) : le DragOverlay
 * ne doit jamais ré-appeler useDraggable sur le même id que la carte
 * d'origine, sous peine de collision d'identifiants dnd-kit.
 */

import { useDraggable } from '@dnd-kit/core';
import { ArrowLeftRight, ClipboardList, UserX, Wrench } from 'lucide-react';
import { TachePlanning, TypeTachePlanning } from '@/domain/types';
import { LIBELLE_MOTIF_REATTRIBUTION } from '@/lib/derived/libelles-interventions';
import { formatDate } from '@/lib/utils';

const ICONE_TYPE: Record<TypeTachePlanning, typeof Wrench> = {
  [TypeTachePlanning.MAINTENANCE]: ClipboardList,
  [TypeTachePlanning.INTERVENTION]: Wrench,
  [TypeTachePlanning.ABSENCE]: UserX,
};

const STYLE_TYPE: Record<TypeTachePlanning, string> = {
  [TypeTachePlanning.MAINTENANCE]: 'bg-sky-50 border-sky-200 text-sky-900',
  [TypeTachePlanning.INTERVENTION]: 'bg-violet-50 border-violet-200 text-violet-900',
  [TypeTachePlanning.ABSENCE]: 'bg-gray-50 border-gray-200 border-dashed text-gray-600',
};

export function TacheCardContenu({ tache }: { tache: TachePlanning }) {
  const Icone = ICONE_TYPE[tache.type];
  return (
    <div className={`w-48 shrink-0 rounded-md border px-2.5 py-2 text-xs ${STYLE_TYPE[tache.type]} ${tache.urgent ? 'ring-1 ring-rose-400' : ''}`}>
      <div className="flex items-center gap-1.5 font-medium">
        <Icone className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{tache.libelle}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-1 text-[11px] opacity-80">
        <span className="truncate">{formatDate(new Date(tache.dateDebut))}</span>
        <span className="truncate">{tache.statutAffichage}</span>
      </div>
      {tache.reaffecte && (
        <div
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700"
          title={tache.motifReaffectation ? LIBELLE_MOTIF_REATTRIBUTION[tache.motifReaffectation] : undefined}
        >
          <ArrowLeftRight className="h-3 w-3" /> Réaffectée
        </div>
      )}
    </div>
  );
}

export default function TacheCard({ tache }: { tache: TachePlanning }) {
  const draggable = tache.type !== TypeTachePlanning.ABSENCE;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tache.id,
    data: { type: tache.type, referenceId: tache.referenceId, technicienId: tache.technicienId },
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className={`${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-30' : ''}`}
    >
      <TacheCardContenu tache={tache} />
    </div>
  );
}
