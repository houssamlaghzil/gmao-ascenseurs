/**
 * Centre des tâches asynchrones (section 16). Server Component : lecture
 * directe du store — getAllTachesAsynchrones renvoie déjà la progression
 * recalculée à la lecture pour les tâches EN_COURS (voir data/store.ts,
 * calculerProgressionTache). Les plus récemment demandées apparaissent en
 * premier.
 */

import { ListTodo } from 'lucide-react';
import { StatutTacheAsynchrone } from '@/domain/types';
import { getAllTachesAsynchrones, getUtilisateurById } from '@/data/store';
import TacheCard from './components/TacheCard';

const ORDRE_STATUT: Record<StatutTacheAsynchrone, number> = {
  [StatutTacheAsynchrone.EN_COURS]: 0,
  [StatutTacheAsynchrone.EN_ATTENTE]: 1,
  [StatutTacheAsynchrone.ECHEC]: 2,
  [StatutTacheAsynchrone.TERMINE]: 3,
};

export default function TachesPage() {
  const taches = [...getAllTachesAsynchrones()].sort((a, b) => {
    const parStatut = ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut];
    if (parStatut !== 0) return parStatut;
    return new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime();
  });

  const nombreEnCours = taches.filter((t) => t.statut === StatutTacheAsynchrone.EN_COURS).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-blue-600" />
          Tâches asynchrones
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {taches.length.toLocaleString('fr-FR')} tâche{taches.length > 1 ? 's' : ''}
          {nombreEnCours > 0 ? ` · ${nombreEnCours} en cours` : ''}
        </p>
      </div>

      <div className="space-y-4">
        {taches.map((tache) => (
          <TacheCard
            key={tache.id}
            tache={tache}
            demandeurNom={getUtilisateurById(tache.demandeParUtilisateurId)?.nomComplet ?? 'Système'}
          />
        ))}
        {taches.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
            Aucune tâche asynchrone en cours ou récente.
          </div>
        )}
      </div>
    </div>
  );
}
