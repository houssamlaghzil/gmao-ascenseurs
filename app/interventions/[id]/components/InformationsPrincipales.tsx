/**
 * Bloc "Informations principales" de l'écran Détail intervention (section
 * 8) : appareil, adresse, client, contrat, motif, source, niveau d'urgence,
 * technicien, état initial de l'appareil constaté.
 */

import Link from 'next/link';
import { Ascenseur, Client, Contrat, Intervention, NiveauSla, SourceTicket, Technicien } from '@/domain/types';
import StatusBadge from '@/components/StatusBadge';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_NIVEAU_URGENCE, LIBELLE_SOURCE_TICKET } from '@/lib/derived/libelles-interventions';

const LIBELLE_NIVEAU_SLA: Record<NiveauSla, string> = {
  [NiveauSla.STANDARD]: 'Standard',
  [NiveauSla.PREMIUM]: 'Premium',
  [NiveauSla.PRIORITAIRE]: 'Prioritaire',
  [NiveauSla.SUR_MESURE]: 'Sur mesure',
};

interface InformationsPrincipalesProps {
  intervention: Intervention;
  ascenseur?: Ascenseur;
  client?: Client;
  contrat?: Contrat;
  technicien?: Technicien;
  sourcePremierTicket?: SourceTicket;
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

export default function InformationsPrincipales({
  intervention,
  ascenseur,
  client,
  contrat,
  technicien,
  sourcePremierTicket,
}: InformationsPrincipalesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Informations principales</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Champ label="Appareil">
          {ascenseur ? (
            <Link href={`/parc/${ascenseur.id}`} className="font-medium text-blue-600 hover:underline">
              {ascenseur.code}
            </Link>
          ) : (
            '—'
          )}
        </Champ>
        <Champ label="Adresse">{ascenseur ? `${ascenseur.adresseComplete}, ${ascenseur.ville}` : '—'}</Champ>
        <Champ label="Client">{client?.raisonSociale ?? '—'}</Champ>
        <Champ label="Contrat">
          {contrat ? `${contrat.numero} · ${LIBELLE_NIVEAU_SLA[contrat.niveauSla]}` : '—'}
        </Champ>
        <Champ label="Motif">
          {LIBELLE_MOTIF_INTERVENTION[intervention.motif]}
          {intervention.motifDetail && <span className="block text-gray-500 mt-0.5">{intervention.motifDetail}</span>}
        </Champ>
        <Champ label="Source">{sourcePremierTicket ? LIBELLE_SOURCE_TICKET[sourcePremierTicket] : '—'}</Champ>
        <Champ label="Niveau d'urgence">{LIBELLE_NIVEAU_URGENCE[intervention.niveauUrgence]}</Champ>
        <Champ label="Technicien affecté">{technicien?.nomComplet ?? 'Non affecté'}</Champ>
        <Champ label="État initial de l'appareil">
          {intervention.accesRefuse ? (
            <span className="text-gray-500">Accès refusé{intervention.motifAccesRefuse ? ` — ${intervention.motifAccesRefuse}` : ''}</span>
          ) : intervention.etatAppareilInitial ? (
            <StatusBadge statut={intervention.etatAppareilInitial} />
          ) : (
            <span className="text-gray-400">Pas encore constaté</span>
          )}
        </Champ>
      </dl>
    </div>
  );
}
