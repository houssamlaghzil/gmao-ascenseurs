'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Ascenseur, ParcAscenseurs } from '@/domain/types';

interface AscenseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  ascenseur: Ascenseur | null;
  parcId: string | null;
  parcs: ParcAscenseurs[];
  onSuccess: (ascenseur: Ascenseur) => void;
}

export default function AscenseurModal({
  isOpen,
  onClose,
  ascenseur,
  parcId,
  parcs,
  onSuccess,
}: AscenseurModalProps) {
  const [nom, setNom] = useState('');
  const [referenceTechnique, setReferenceTechnique] = useState('');
  const [selectedParcId, setSelectedParcId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ascenseur) {
      setNom(ascenseur.nom);
      setReferenceTechnique(ascenseur.referenceTechnique || '');
      setSelectedParcId(ascenseur.parcId);
    } else {
      setNom('');
      setReferenceTechnique('');
      setSelectedParcId(parcId || (parcs[0]?.id || ''));
    }
    setError('');
  }, [ascenseur, parcId, parcs, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom.trim() || !selectedParcId) {
      setError('Le nom et le parc sont obligatoires');
      return;
    }

    setLoading(true);

    try {
      const method = ascenseur ? 'PUT' : 'POST';
      const body = ascenseur
        ? { id: ascenseur.id, nom, referenceTechnique, parcId: selectedParcId }
        : { nom, referenceTechnique, parcId: selectedParcId };

      const res = await fetch('/api/ascenseurs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      onSuccess(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {ascenseur ? 'Modifier l\'ascenseur' : 'Nouvel ascenseur'}
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
              Nom de l&apos;ascenseur *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Ascenseur A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence technique
            </label>
            <input
              type="text"
              value={referenceTechnique}
              onChange={(e) => setReferenceTechnique(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: ASC-001-2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parc *
            </label>
            <select
              value={selectedParcId}
              onChange={(e) => setSelectedParcId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Sélectionnez un parc</option>
              {parcs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} - {p.ville}
                </option>
              ))}
            </select>
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : ascenseur ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
