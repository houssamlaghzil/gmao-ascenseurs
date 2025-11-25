'use client';

/**
 * Composant client principal pour la gestion avec drag & drop
 * Refactorisé avec React Query pour gestion d'état serveur optimisée
 */

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Plus, LayoutGrid } from 'lucide-react';
import ParcCard from './ParcCard';
import AscenseurCard from './AscenseurCard';
import ParcModal from './ParcModal';
import AscenseurModal from './AscenseurModal';
import { ParcAscenseurs, Ascenseur } from '@/domain/types';
import { useParcs, useAscenseurs, useMoveAscenseur, useDeleteParc, useDeleteAscenseur } from '@/lib/react-query/hooks';
import { SkeletonList } from '@/components/skeletons';

interface GestionClientProps {
  initialParcs: ParcAscenseurs[];
  initialAscenseurs: Ascenseur[];
}

export default function GestionClient({ initialParcs, initialAscenseurs }: GestionClientProps) {
  // React Query hooks avec données initiales du serveur
  const { data: parcs = initialParcs, isLoading: parcsLoading } = useParcs();
  const { data: ascenseurs = initialAscenseurs, isLoading: ascenseursLoading } = useAscenseurs();
  const moveAscenseurMutation = useMoveAscenseur();
  const deleteParc = useDeleteParc();
  const deleteAscenseur = useDeleteAscenseur();
  
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [parcModalOpen, setParcModalOpen] = useState(false);
  const [ascenseurModalOpen, setAscenseurModalOpen] = useState(false);
  const [editingParc, setEditingParc] = useState<ParcAscenseurs | null>(null);
  const [editingAscenseur, setEditingAscenseur] = useState<Ascenseur | null>(null);
  const [selectedParcId, setSelectedParcId] = useState<string | null>(null);
  
  const isLoading = parcsLoading || ascenseursLoading;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    // Vérifier si on dépose sur un parc
    if (over.id.toString().startsWith('parc-')) {
      const ascenseurId = active.id as string;
      const newParcId = over.id as string;

      // Mise à jour optimiste via React Query
      moveAscenseurMutation.mutate({
        id: ascenseurId,
        parcId: newParcId,
        action: 'move',
      });
    }
  };

  // Les modales gèrent maintenant les mutations via React Query
  // Les données se synchronisent automatiquement

  const draggedAscenseur = ascenseurs.find((a) => a.id === activeDragId);

  // Afficher les skeletons pendant le chargement
  if (isLoading) {
    return <SkeletonList count={6} />;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Barre d'actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingParc(null);
              setParcModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Nouveau Parc</span>
          </button>
          <button
            onClick={() => {
              setEditingAscenseur(null);
              setSelectedParcId(parcs[0]?.id || null);
              setAscenseurModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Nouvel Ascenseur</span>
          </button>
          
          {/* Indicateur de sauvegarde avec React Query */}
          {moveAscenseurMutation.isPending && (
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span>Sauvegarde en cours...</span>
            </div>
          )}
        </div>

        {/* Grille des parcs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parcs.map((parc) => (
            <ParcCard
              key={parc.id}
              parc={parc}
              ascenseurs={ascenseurs.filter((a) => a.parcId === parc.id)}
              onEdit={() => {
                setEditingParc(parc);
                setParcModalOpen(true);
              }}
              onDelete={(id) => deleteParc.mutate(id)}
              onAddAscenseur={() => {
                setEditingAscenseur(null);
                setSelectedParcId(parc.id);
                setAscenseurModalOpen(true);
              }}
              onEditAscenseur={(asc) => {
                setEditingAscenseur(asc);
                setSelectedParcId(parc.id);
                setAscenseurModalOpen(true);
              }}
              onDeleteAscenseur={(id) => deleteAscenseur.mutate(id)}
            />
          ))}
        </div>

        {parcs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun parc
            </h3>
            <p className="text-gray-600">
              Commencez par créer votre premier parc d&apos;ascenseurs
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ParcModal
        isOpen={parcModalOpen}
        onClose={() => setParcModalOpen(false)}
        parc={editingParc}
        onSuccess={() => {
          setParcModalOpen(false);
        }}
      />

      <AscenseurModal
        isOpen={ascenseurModalOpen}
        onClose={() => setAscenseurModalOpen(false)}
        ascenseur={editingAscenseur}
        parcId={selectedParcId}
        parcs={parcs}
        onSuccess={() => {
          setAscenseurModalOpen(false);
        }}
      />

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedAscenseur && (
          <div className="opacity-90">
            <AscenseurCard ascenseur={draggedAscenseur} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
