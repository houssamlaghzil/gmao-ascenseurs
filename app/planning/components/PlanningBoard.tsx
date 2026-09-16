'use client';

/**
 * Conteneur de lignes technicien du planning (section 11.1), avec
 * réaffectation par glisser-déposer (section 11.2) : DndContext au niveau
 * du conteneur, onDragEnd résout la ligne technicien cible (useDroppable,
 * id `row-<technicienId>`) et appelle la Server Action correspondante
 * (app/planning/actions.ts) — reaffecter (business-logic) pour une
 * intervention, mise à jour directe de Maintenance.technicienId sinon.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { TachePlanning } from '@/domain/types';
import type { LignePlanningTechnicien } from '@/lib/derived/planning';
import { reaffecterTachePlanningAction } from '../actions';
import TechnicienRow from './TechnicienRow';
import { TacheCardContenu } from './TacheCard';

interface PlanningBoardProps {
  lignes: LignePlanningTechnicien[];
}

export default function PlanningBoard({ lignes }: PlanningBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tacheActive, setTacheActive] = useState<TachePlanning | null>(null);
  const [erreur, setErreur] = useState<string | undefined>();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const toutesLesTaches = lignes.flatMap((l) => l.taches);

  const handleDragStart = (event: DragStartEvent) => {
    setErreur(undefined);
    setTacheActive(toutesLesTaches.find((t) => t.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setTacheActive(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith('row-')) return;
    const nouveauTechnicienId = overId.slice('row-'.length);

    const data = active.data.current as { type: TachePlanning['type']; referenceId: string; technicienId: string } | undefined;
    if (!data || data.technicienId === nouveauTechnicienId) return;

    startTransition(async () => {
      const resultat = await reaffecterTachePlanningAction(data.type, data.referenceId, nouveauTechnicienId);
      if (resultat.success) router.refresh();
      else setErreur(resultat.error ?? 'Erreur inattendue lors de la réaffectation.');
    });
  };

  return (
    <div className="space-y-3">
      {erreur && (
        <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{erreur}</span>
        </div>
      )}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Réaffectation en cours…
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {lignes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
              Aucun technicien ne correspond à ces filtres.
            </div>
          ) : (
            lignes.map((ligne) => <TechnicienRow key={ligne.technicien.id} ligne={ligne} />)
          )}
        </div>

        <DragOverlay>{tacheActive ? <TacheCardContenu tache={tacheActive} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
