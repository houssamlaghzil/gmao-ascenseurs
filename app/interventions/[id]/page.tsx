/**
 * Détail d'une intervention (section 8) — Server Component : toutes les
 * jointures sont faites ici, une seule fois, puis transmises aux blocs de
 * la page (informations principales, chronologie, tickets, rapports,
 * réattribution). Même convention que app/parc/[id]/page.tsx.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { TypeCiblePlanning } from '@/domain/types';
import {
  getAllTechniciens,
  getAscenseurById,
  getClientById,
  getContratById,
  getEtapesInterventionParId,
  getInterventionById,
  getRapportsByInterventionId,
  getReaffectationsByCible,
  getTechnicienById,
  getTicketsByInterventionId,
} from '@/data/store';
import { calculerEtatSLA } from '@/lib/derived/sla';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { EtatSLABadge, PrioriteInterventionBadge } from '@/components/StatusBadges';
import InformationsPrincipales from './components/InformationsPrincipales';
import ChronologieIntervention from './components/ChronologieIntervention';
import GestionnaireTickets from './components/GestionnaireTickets';
import RapportsAssocies from './components/RapportsAssocies';
import ReattributionPanel, { type ReaffectationAffichee } from './components/ReattributionPanel';

export const dynamic = 'force-dynamic';

interface InterventionDetailPageProps {
  params: { id: string };
}

export default function InterventionDetailPage({ params }: InterventionDetailPageProps) {
  const intervention = getInterventionById(params.id);
  if (!intervention) notFound();

  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const client = ascenseur ? getClientById(ascenseur.clientId) : undefined;
  const contrat = intervention.contratId ? getContratById(intervention.contratId) : undefined;
  const technicienActuel = intervention.technicienId ? getTechnicienById(intervention.technicienId) : undefined;

  const tickets = getTicketsByInterventionId(intervention.id);
  const etapes = getEtapesInterventionParId(intervention.id);
  const rapports = getRapportsByInterventionId(intervention.id);
  const reaffectations = getReaffectationsByCible(TypeCiblePlanning.INTERVENTION, intervention.id);
  const sla = calculerEtatSLA(intervention);

  const historique: ReaffectationAffichee[] = reaffectations.map((r) => ({
    id: r.id,
    dateHeure: r.dateHeure,
    ancienTechnicienNom: r.ancienTechnicienId ? getTechnicienById(r.ancienTechnicienId)?.nomComplet : undefined,
    nouveauTechnicienNom: getTechnicienById(r.nouveauTechnicienId)?.nomComplet ?? '—',
    motif: r.motif,
    commentaire: r.commentaire,
    origine: r.origine,
    demandeurNom: r.demandeurNom,
  }));

  const techniciensDisponibles = getAllTechniciens()
    .filter((t) => t.actif && t.id !== intervention.technicienId)
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))
    .map((t) => ({ id: t.id, label: t.nomComplet }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/interventions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux interventions
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{intervention.numero}</h1>
              <StatutInterventionBadge statut={intervention.statut} />
              <PrioriteInterventionBadge priorite={intervention.priorite} />
              <EtatSLABadge etat={sla.etat} />
            </div>
            {ascenseur && (
              <p className="text-sm text-gray-600 mt-1">
                {ascenseur.code} — {ascenseur.adresseComplete}, {ascenseur.ville}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-600 text-right">
            <p>{client?.raisonSociale ?? 'Client inconnu'}</p>
            <p className="text-gray-400">Contrat {contrat?.numero ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InformationsPrincipales
            intervention={intervention}
            ascenseur={ascenseur}
            client={client}
            contrat={contrat}
            technicien={technicienActuel}
            sourcePremierTicket={tickets[0]?.source}
          />
          <ChronologieIntervention etapes={etapes} />
          <GestionnaireTickets tickets={tickets} />
          <RapportsAssocies rapports={rapports} />
        </div>
        <div className="space-y-6">
          <ReattributionPanel
            interventionId={intervention.id}
            statutIntervention={intervention.statut}
            techniciensDisponibles={techniciensDisponibles}
            historique={historique}
          />
        </div>
      </div>
    </div>
  );
}
