'use client';

/**
 * Composant affichant les actions possibles sur un ascenseur selon son état
 * Refactorisé avec React Query pour UI optimiste
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { EtatGlobal, SousEtatPanne } from '@/domain/types';
import { AlertCircle, UserCheck, Play, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useTechniciensByParc } from '@/lib/react-query/hooks';
import {
  useDeclarerPanne,
  useAttribuerTechnicien,
  useDebuterReparation,
  useTerminerReparation,
} from '@/lib/react-query/hooks';

interface AscenseurActionsProps {
  ascenseur: any;
  parcId: string;
}

export default function AscenseurActions({ ascenseur, parcId }: AscenseurActionsProps) {
  const router = useRouter();
  const [selectedTechnicien, setSelectedTechnicien] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // React Query hooks
  const { data: techniciens = [], isLoading: techniciensLoading } = useTechniciensByParc(parcId);
  const declarerPanneMutation = useDeclarerPanne(ascenseur.id);
  const attribuerTechnicienMutation = useAttribuerTechnicien(ascenseur.id);
  const debuterReparationMutation = useDebuterReparation(ascenseur.id);
  const terminerReparationMutation = useTerminerReparation(ascenseur.id);

  const loading =
    declarerPanneMutation.isPending ||
    attribuerTechnicienMutation.isPending ||
    debuterReparationMutation.isPending ||
    terminerReparationMutation.isPending;

  const error =
    declarerPanneMutation.error?.message ||
    attribuerTechnicienMutation.error?.message ||
    debuterReparationMutation.error?.message ||
    terminerReparationMutation.error?.message ||
    null;

  const handleDeclarerPanne = () => {
    if (!commentaire.trim()) return;
    
    declarerPanneMutation.mutate(
      { commentaire },
      {
        onSuccess: () => {
          setCommentaire('');
          router.refresh();
        },
      }
    );
  };

  const handleAttribuerTechnicien = () => {
    if (!selectedTechnicien) return;
    
    attribuerTechnicienMutation.mutate(
      { technicienId: selectedTechnicien },
      {
        onSuccess: () => {
          setSelectedTechnicien('');
          router.refresh();
        },
      }
    );
  };

  const handleDebuterReparation = () => {
    debuterReparationMutation.mutate(undefined, {
      onSuccess: () => {
        router.refresh();
      },
    });
  };

  const handleTerminerReparation = () => {
    terminerReparationMutation.mutate(undefined, {
      onSuccess: () => {
        setCommentaire('');
        router.refresh();
      },
    });
  };

  return (
    <Card title="Actions" subtitle="Gestion de l'ascenseur">
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && (
        <div className="space-y-4">
          {/* Ascenseur fonctionnel */}
          {ascenseur.etatGlobal === EtatGlobal.FONCTIONNEL && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Cet ascenseur est actuellement en service.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire de panne
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Décrivez la panne..."
                />
              </div>
              <button
                onClick={handleDeclarerPanne}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <AlertCircle className="h-5 w-5" />
                <span>Déclarer une panne</span>
              </button>
            </div>
          )}

          {/* En panne - non attribué */}
          {ascenseur.etatGlobal === EtatGlobal.EN_PANNE &&
            ascenseur.sousEtatPanne === SousEtatPanne.EN_COURS_D_ATTRIBUTION && (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    Panne déclarée - En attente d&apos;attribution
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un technicien
                  </label>
                  <select
                    value={selectedTechnicien}
                    onChange={(e) => setSelectedTechnicien(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choisir un technicien --</option>
                    {techniciens.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.nomComplet} ({tech.specialite})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAttribuerTechnicien}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <UserCheck className="h-5 w-5" />
                  <span>Attribuer au technicien</span>
                </button>
              </div>
            )}

          {/* En panne - attribué */}
          {ascenseur.etatGlobal === EtatGlobal.EN_PANNE &&
            ascenseur.sousEtatPanne === SousEtatPanne.ATTRIBUE && (
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    Panne attribuée - Prêt à démarrer la réparation
                  </p>
                  {ascenseur.technicienAttribueId && (
                    <p className="text-sm text-orange-700 mt-1">
                      Technicien: {ascenseur.technicienAttribueId}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDebuterReparation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  <span>Démarrer la réparation</span>
                </button>
              </div>
            )}

          {/* En cours de réparation */}
          {ascenseur.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION && (
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  Réparation en cours
                </p>
                {ascenseur.technicienAttribueId && (
                  <p className="text-sm text-yellow-700 mt-1">
                    Technicien: {ascenseur.technicienAttribueId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire de clôture (optionnel)
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Notes sur la réparation..."
                />
              </div>
              <button
                onClick={handleTerminerReparation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Clôturer et remettre en service</span>
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
