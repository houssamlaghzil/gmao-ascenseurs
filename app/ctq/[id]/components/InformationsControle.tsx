/**
 * En-tête du détail d'un contrôle CTQ (section 10.2) : appareil, client,
 * bureau d'études, technicien référent, échéances et statut.
 */

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Ascenseur, BureauEtudes, Client, ControleCTQ, StatutControleCTQ, Technicien } from '@/domain/types';
import { StatutControleCTQBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';

const LIBELLE_STATUT_CONTROLE_CTQ: Record<StatutControleCTQ, string> = {
  [StatutControleCTQ.PLANIFIE]: 'Planifié',
  [StatutControleCTQ.REALISE_SANS_RESERVE]: 'Réalisé sans réserve',
  [StatutControleCTQ.RESERVES_A_TRAITER]: 'Réserves à traiter',
  [StatutControleCTQ.RESERVES_EN_COURS]: 'Réserves en cours',
  [StatutControleCTQ.RESERVES_A_CONTROLER]: 'Réserves à contrôler',
  [StatutControleCTQ.SOLDE]: 'Soldé',
};

interface InformationsControleProps {
  controle: ControleCTQ;
  ascenseur?: Ascenseur;
  client?: Client;
  bureauEtudes?: BureauEtudes;
  technicien?: Technicien;
  statutRecalcule: StatutControleCTQ;
}

export default function InformationsControle({ controle, ascenseur, client, bureauEtudes, technicien, statutRecalcule }: InformationsControleProps) {
  // Un contrôle PLANIFIE (visite à venir, 0 réserve) n'a pas d'équivalent dans calculerStatutControle
  // (qui suppose toujours un contrôle déjà réalisé) : l'écart n'est donc affiché que hors de ce cas.
  const ecartStatut = controle.statut !== StatutControleCTQ.PLANIFIE && statutRecalcule !== controle.statut;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{controle.numero}</h1>
            <StatutControleCTQBadge statut={controle.statut} />
          </div>
          {ascenseur ? (
            <p className="text-sm text-gray-600 mt-1">
              <Link href={`/parc/${ascenseur.id}`} className="text-blue-600 hover:underline">
                {ascenseur.code}
              </Link>
              {' — '}
              {ascenseur.adresseComplete}, {ascenseur.ville}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Appareil introuvable ({controle.appareilId})</p>
          )}
          {ecartStatut && (
            <p className="text-xs text-amber-600 mt-1">
              Écart de cohérence : le statut recalculé à partir des réserves serait « {LIBELLE_STATUT_CONTROLE_CTQ[statutRecalcule]} ».
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600 text-right">
          <p>{client?.raisonSociale ?? 'Client inconnu'}</p>
          <p className="text-gray-400">{bureauEtudes?.nom ?? 'Bureau d’études inconnu'}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Date de visite</dt>
          <dd className="text-gray-900 mt-0.5">{formatDate(new Date(controle.dateVisite))}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Prochain contrôle</dt>
          <dd className="text-gray-900 mt-0.5">{formatDate(new Date(controle.dateProchainControle))}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Réserves</dt>
          <dd className="text-gray-900 mt-0.5">
            {controle.nombreReserves === 0 ? 'Aucune' : `${controle.nombreReservesSoldees} / ${controle.nombreReserves} soldées`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase">Technicien référent</dt>
          <dd className="text-gray-900 mt-0.5">{technicien?.nomComplet ?? '—'}</dd>
        </div>
        {bureauEtudes?.agrement && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Agrément</dt>
            <dd className="text-gray-900 mt-0.5">{bureauEtudes.agrement}</dd>
          </div>
        )}
        {bureauEtudes?.contact && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Contact bureau d&apos;études</dt>
            <dd className="text-gray-900 mt-0.5">
              {bureauEtudes.contact}
              {bureauEtudes.telephone ? ` — ${bureauEtudes.telephone}` : ''}
            </dd>
          </div>
        )}
        {controle.rapportPdfUrl && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Rapport</dt>
            <dd className="mt-0.5">
              <a
                href={controle.rapportPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" /> Télécharger le PDF
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
