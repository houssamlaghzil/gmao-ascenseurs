/**
 * Onglet Audit logs de l'écran Administration (section 17/46) : flux
 * transverse de toutes les entités sensibles (getAllEntreesAudit, déjà trié
 * du plus récent au plus ancien par le store), rendu avec le composant
 * Timeline générique. Reproduit l'exemple canonique du cahier des charges :
 * "<Nom> a modifié le digicode. 4521 → 8754".
 */

import { EntreeAudit } from '@/domain/types';
import Timeline, { type TimelineItem } from '@/components/Timeline';
import { StatutSynchronisationBadge } from '@/components/StatusBadges';
import { LIBELLE_ORIGINE_ACTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_TYPE_ENTITE_AUDITEE } from '@/lib/derived/libelles-administration';

interface AuditLogsTabProps {
  entrees: EntreeAudit[];
}

export default function AuditLogsTab({ entrees }: AuditLogsTabProps) {
  const items: TimelineItem[] = entrees.map((entree) => ({
    id: entree.id,
    dateHeure: entree.dateHeure,
    description: `${entree.utilisateurNom ?? 'Système'} ${entree.description}`,
    badge: (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
          {LIBELLE_TYPE_ENTITE_AUDITEE[entree.typeEntite]}
        </span>
        <span className="text-xs text-gray-400">{LIBELLE_ORIGINE_ACTION[entree.origine]}</span>
        {entree.statutSynchronisation && <StatutSynchronisationBadge statut={entree.statutSynchronisation} />}
      </div>
    ),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <Timeline items={items} emptyLabel="Aucune entrée d'audit." />
    </div>
  );
}
