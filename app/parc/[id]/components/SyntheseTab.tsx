/**
 * Onglet Synthèse de la fiche appareil (section 4.2).
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Ascenseur, ParcAscenseurs, Client, Contrat, Technicien, Tournee, Intervention, Maintenance } from '@/domain/types';
import StatusBadge from '@/components/StatusBadge';
import { StatutContratBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { classeCouleurDisponibilite } from '@/lib/derived/disponibilite';
import { libellesEtagesConcernes } from '@/lib/derived/mode-degrade';

interface SyntheseTabProps {
  ascenseur: Ascenseur;
  parc?: ParcAscenseurs;
  client?: Client;
  contrat?: Contrat;
  technicien?: Technicien;
  tournee?: Tournee;
  disponibilitePourcent: number;
  derniereIntervention?: Intervention;
  prochaineMaintenance?: Maintenance;
}

function Champ({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function SyntheseTab({
  ascenseur,
  parc,
  client,
  contrat,
  technicien,
  tournee,
  disponibilitePourcent,
  derniereIntervention,
  prochaineMaintenance,
}: SyntheseTabProps) {
  return (
    <div className="space-y-6">
      {ascenseur.modeDegrade && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Mode dégradé — étages concernés : {libellesEtagesConcernes(ascenseur)}
            </p>
            {ascenseur.modeDegrade.commentaire && (
              <p className="text-sm text-amber-700 mt-1">{ascenseur.modeDegrade.commentaire}</p>
            )}
            <p className="text-xs text-amber-600 mt-1">
              Depuis le {formatDate(new Date(ascenseur.modeDegrade.dateDebut))} — signalé par {ascenseur.modeDegrade.responsableChangement.nomAffiche}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Champ label="Code appareil" value={ascenseur.code} />
          <Champ
            label="Adresse complète"
            value={
              <>
                {ascenseur.adresseComplete}
                <br />
                {ascenseur.codePostal ? `${ascenseur.codePostal} ` : ''}
                {ascenseur.ville}
              </>
            }
          />
          <Champ label="Statut actuel" value={<StatusBadge statut={ascenseur.statutAppareil} />} />

          <Champ label="Client" value={client?.raisonSociale ?? '—'} />
          <Champ
            label="Contrat"
            value={
              contrat ? (
                <span className="inline-flex items-center gap-2">
                  {contrat.numero}
                  <StatutContratBadge statut={contrat.statut} />
                </span>
              ) : (
                '—'
              )
            }
          />
          <Champ label="Site (parc)" value={parc ? `${parc.nom} — ${parc.ville}` : '—'} />

          <Champ label="Technicien affecté" value={technicien?.nomComplet ?? 'Non affecté'} />
          <Champ label="Tournée" value={tournee?.nom ?? '—'} />
          <Champ
            label="Disponibilité (indicative)"
            value={<span className={`font-semibold ${classeCouleurDisponibilite(disponibilitePourcent)}`}>{disponibilitePourcent} %</span>}
          />

          <Champ
            label="Dernière intervention"
            value={
              derniereIntervention ? (
                <Link href={`/interventions/${derniereIntervention.id}`} className="text-blue-600 hover:underline">
                  {derniereIntervention.numero} — {formatDate(new Date(derniereIntervention.dateCreation))}
                </Link>
              ) : (
                'Aucune'
              )
            }
          />
          <Champ
            label="Prochaine maintenance"
            value={prochaineMaintenance ? formatDate(new Date(prochaineMaintenance.datePrevue)) : 'Aucune planifiée'}
          />
        </dl>
      </div>
    </div>
  );
}
