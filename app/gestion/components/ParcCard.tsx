'use client';

import { useDroppable } from '@dnd-kit/core';
import { Building, Edit, Trash2, Plus, MapPin } from 'lucide-react';
import { ParcAscenseurs, Ascenseur } from '@/domain/types';
import AscenseurCard from './AscenseurCard';

interface ParcCardProps {
  parc: ParcAscenseurs;
  ascenseurs: Ascenseur[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onAddAscenseur: () => void;
  onEditAscenseur: (ascenseur: Ascenseur) => void;
  onDeleteAscenseur: (id: string) => void;
}

export default function ParcCard({
  parc,
  ascenseurs,
  onEdit,
  onDelete,
  onAddAscenseur,
  onEditAscenseur,
  onDeleteAscenseur,
}: ParcCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: parc.id,
  });

  const handleDelete = async () => {
    if (ascenseurs.length > 0) {
      if (!confirm(`Ce parc contient ${ascenseurs.length} ascenseur(s). Êtes-vous sûr de vouloir le supprimer ?`)) {
        return;
      }
    }

    try {
      await fetch(`/api/parcs?id=${parc.id}`, { method: 'DELETE' });
      onDelete(parc.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du parc');
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 transition-all ${
        isOver
          ? 'border-primary-500 bg-primary-50 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* En-tête du parc */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">{parc.nom}</h3>
            </div>
            {parc.description && (
              <p className="text-sm text-gray-600 mt-1">{parc.description}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <MapPin className="h-4 w-4" />
              <span>{parc.ville}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-primary-100 rounded-md transition-colors"
              title="Modifier"
            >
              <Edit className="h-4 w-4 text-primary-600" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des ascenseurs */}
      <div className="p-4 min-h-[200px] space-y-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Ascenseurs ({ascenseurs.length})
          </span>
          <button
            onClick={onAddAscenseur}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Ajouter</span>
          </button>
        </div>

        {ascenseurs.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">
              {isOver ? 'Déposez ici' : 'Aucun ascenseur'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ascenseurs.map((ascenseur) => (
              <AscenseurCard
                key={ascenseur.id}
                ascenseur={ascenseur}
                onEdit={() => onEditAscenseur(ascenseur)}
                onDelete={() => onDeleteAscenseur(ascenseur.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
