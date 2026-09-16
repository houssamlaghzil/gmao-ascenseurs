/**
 * Onglet Historique de la fiche appareil (section 4.2) : journal des
 * modifications, affiché avec le composant Timeline générique.
 */

import { EntreeJournalModification } from '@/domain/types';
import Timeline, { TimelineItem } from '@/components/Timeline';
import { LIBELLE_ORIGINE_ACTION } from '@/lib/derived/libelles-parc';

export default function HistoriqueTab({ entrees }: { entrees: EntreeJournalModification[] }) {
  const items: TimelineItem[] = entrees.map((entree) => ({
    id: entree.id,
    dateHeure: entree.dateModification,
    badge: (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200">
          {entree.libelleChamp}
        </span>
        <span className="text-xs text-gray-400">
          {LIBELLE_ORIGINE_ACTION[entree.origine]} · {entree.auteur.nomAffiche}
        </span>
      </div>
    ),
    description: `${entree.ancienneValeur || '—'} → ${entree.nouvelleValeur || '—'}`,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <Timeline items={items} emptyLabel="Aucune modification enregistrée pour cet appareil" />
    </div>
  );
}
