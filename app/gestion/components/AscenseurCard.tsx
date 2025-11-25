'use client';

import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Ascenseur } from '@/domain/types';
import StatusBadge from '@/components/StatusBadgeNew';

interface AscenseurCardProps {
  ascenseur: Ascenseur;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

export default function AscenseurCard({
  ascenseur,
  onEdit,
  onDelete,
  isDragging = false,
}: AscenseurCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ascenseur.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ascenseur ?')) {
      return;
    }

    try {
      await fetch(`/api/ascenseurs?id=${ascenseur.id}`, { method: 'DELETE' });
      if (onDelete) onDelete(ascenseur.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'ascenseur');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-gray-200 rounded-md p-3 hover:border-primary-300 hover:shadow-md transition-all cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {ascenseur.nom}
            </h4>
            <StatusBadge etatGlobal={ascenseur.etatGlobal} sousEtatPanne={ascenseur.sousEtatPanne} />
          </div>
          {ascenseur.referenceTechnique && (
            <p className="text-xs text-gray-500 truncate">
              Réf: {ascenseur.referenceTechnique}
            </p>
          )}
        </div>

        {!isDragging && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 hover:bg-primary-100 rounded transition-colors"
                title="Modifier"
              >
                <Edit className="h-3.5 w-3.5 text-primary-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
