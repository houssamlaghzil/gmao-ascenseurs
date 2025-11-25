'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ParcAscenseurs } from '@/domain/types';
import { useCreateParc, useUpdateParc } from '@/lib/react-query/hooks';

interface ParcModalProps {
  isOpen: boolean;
  onClose: () => void;
  parc: ParcAscenseurs | null;
  onSuccess: () => void;
}

export default function ParcModal({ isOpen, onClose, parc, onSuccess }: ParcModalProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  
  const createMutation = useCreateParc();
  const updateMutation = useUpdateParc();
  
  const loading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error?.message || updateMutation.error?.message || '';

  useEffect(() => {
    if (parc) {
      setNom(parc.nom);
      setDescription(parc.description);
      setVille(parc.ville);
      setAdresse(parc.adresse);
    } else {
      setNom('');
      setDescription('');
      setVille('');
      setAdresse('');
    }
  }, [parc, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim() || !ville.trim() || !adresse.trim()) {
      return;
    }

    const input = { nom, description, ville, adresse };

    if (parc) {
      updateMutation.mutate(
        { id: parc.id, ...input },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          onSuccess();
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {parc ? 'Modifier le parc' : 'Nouveau parc'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du parc *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Parc Résidentiel Centre-ville"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Description du parc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville *
            </label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Paris"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: 123 Rue de la République"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : parc ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
