/**
 * Carte d'une tâche du centre de traitements asynchrones (section 16) : type,
 * statut, barre de progression (déjà calculée à la lecture par le store pour
 * les tâches EN_COURS — voir data/store.ts, calculerProgressionTache) et
 * résultat téléchargeable si terminée.
 */

import { Download } from 'lucide-react';
import { StatutTacheAsynchrone, TacheAsynchrone } from '@/domain/types';
import { StatutTacheAsynchroneBadge } from '@/components/StatusBadges';
import { formatDistanceToNow } from '@/lib/utils';
import { LIBELLE_FORMAT_FICHIER_EXPORT, LIBELLE_TYPE_TACHE_ASYNCHRONE, LIBELLE_WORKER_TRAITEMENT, formatTailleOctets } from '@/lib/derived/libelles-taches';

interface TacheCardProps {
  tache: TacheAsynchrone;
  demandeurNom: string;
}

function CouleurBarre(statut: StatutTacheAsynchrone): string {
  switch (statut) {
    case StatutTacheAsynchrone.ECHEC:
      return 'bg-rose-500';
    case StatutTacheAsynchrone.TERMINE:
      return 'bg-emerald-500';
    default:
      return 'bg-sky-500';
  }
}

export default function TacheCard({ tache, demandeurNom }: TacheCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{tache.libelle}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {LIBELLE_TYPE_TACHE_ASYNCHRONE[tache.type]}
            {tache.worker && ` · ${LIBELLE_WORKER_TRAITEMENT[tache.worker]}`}
          </p>
        </div>
        <StatutTacheAsynchroneBadge statut={tache.statut} />
      </div>

      {tache.progression !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {tache.nombreElementsTotal !== undefined && tache.nombreElementsTraites !== undefined
                ? `${tache.nombreElementsTraites} / ${tache.nombreElementsTotal} éléments traités`
                : 'Progression'}
            </span>
            <span className="font-medium text-gray-700">{tache.progression}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${CouleurBarre(tache.statut)}`}
              style={{ width: `${tache.progression}%` }}
            />
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Demandé par</dt>
          <dd className="mt-0.5 text-gray-900">{demandeurNom}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Demandé</dt>
          <dd className="mt-0.5 text-gray-900">{formatDistanceToNow(new Date(tache.dateDemande))}</dd>
        </div>
        {tache.dateFin && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">
              {tache.statut === StatutTacheAsynchrone.ECHEC ? 'Échouée' : 'Terminée'}
            </dt>
            <dd className="mt-0.5 text-gray-900">{formatDistanceToNow(new Date(tache.dateFin))}</dd>
          </div>
        )}
        {tache.nombreTentatives !== undefined && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Tentatives</dt>
            <dd className="mt-0.5 text-gray-900">{tache.nombreTentatives}</dd>
          </div>
        )}
      </dl>

      {tache.messageErreur && (
        <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{tache.messageErreur}</p>
      )}

      {tache.resultat && (
        <a
          href={tache.resultat.urlTelechargement}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <Download className="h-4 w-4" />
          {tache.resultat.nomFichier}
          <span className="text-gray-400">
            ({LIBELLE_FORMAT_FICHIER_EXPORT[tache.resultat.formatFichier]} · {formatTailleOctets(tache.resultat.tailleOctets)})
          </span>
        </a>
      )}
    </div>
  );
}
