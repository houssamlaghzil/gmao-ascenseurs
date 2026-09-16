/**
 * Fiche appareil (section 4.2) — remplace app/parcs/[id] et
 * app/ascenseurs/[id]. Server Component : toutes les jointures sont faites
 * ici, une seule fois, puis transmises aux onglets (eux-mêmes des Server
 * Components) rendus par le composant client OngletsAppareil.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  getAscenseurById,
  getParcById,
  getClientById,
  getContratById,
  getTechnicienById,
  getTourneeById,
  getMaintenancesByAscenseurId,
  getHistoriqueMaintenanceParAscenseurId,
  getInterventionsByAscenseurId,
  getRapportsByAscenseurId,
  getControlesCTQByAppareilId,
  getReservesCTQByAppareilId,
  getEntreesJournalModificationByAscenseurId,
} from '@/data/store';
import StatusBadge from '@/components/StatusBadge';
import OngletsAppareil, { OngletAppareil } from './components/OngletsAppareil';
import SyntheseTab from './components/SyntheseTab';
import FicheTechniqueTab from './components/FicheTechniqueTab';
import MaintenancesTab from './components/MaintenancesTab';
import InterventionsTab from './components/InterventionsTab';
import RapportsTab from './components/RapportsTab';
import CtqTab from './components/CtqTab';
import HistoriqueTab from './components/HistoriqueTab';
import { calculerDisponibilitePourcent } from '@/lib/derived/disponibilite';
import { trouverProchaineMaintenancePlanifiee } from '@/lib/derived/maintenances-appareil';

export const dynamic = 'force-dynamic';

interface FicheAppareilPageProps {
  params: { id: string };
}

export default function FicheAppareilPage({ params }: FicheAppareilPageProps) {
  const ascenseur = getAscenseurById(params.id);
  if (!ascenseur) notFound();

  const parc = getParcById(ascenseur.parcId);
  const client = getClientById(ascenseur.clientId);
  const contrat = getContratById(ascenseur.contratId);
  const technicien = ascenseur.technicienAffecteId ? getTechnicienById(ascenseur.technicienAffecteId) : undefined;
  const tournee = ascenseur.tourneeId ? getTourneeById(ascenseur.tourneeId) : undefined;

  const maintenances = getMaintenancesByAscenseurId(ascenseur.id);
  const historiqueMaintenance = getHistoriqueMaintenanceParAscenseurId(ascenseur.id);
  const interventions = getInterventionsByAscenseurId(ascenseur.id);
  const rapports = getRapportsByAscenseurId(ascenseur.id);
  const controlesCTQ = getControlesCTQByAppareilId(ascenseur.id);
  const reservesCTQ = getReservesCTQByAppareilId(ascenseur.id);
  const journal = getEntreesJournalModificationByAscenseurId(ascenseur.id);

  const disponibilitePourcent = calculerDisponibilitePourcent(ascenseur, interventions);
  const derniereIntervention = [...interventions].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  )[0];
  const prochaineMaintenance = trouverProchaineMaintenancePlanifiee(maintenances);

  const tabs: OngletAppareil[] = [
    {
      id: 'synthese',
      label: 'Synthèse',
      content: (
        <SyntheseTab
          ascenseur={ascenseur}
          parc={parc}
          client={client}
          contrat={contrat}
          technicien={technicien}
          tournee={tournee}
          disponibilitePourcent={disponibilitePourcent}
          derniereIntervention={derniereIntervention}
          prochaineMaintenance={prochaineMaintenance}
        />
      ),
    },
    { id: 'fiche-technique', label: 'Fiche technique', content: <FicheTechniqueTab ascenseur={ascenseur} /> },
    {
      id: 'maintenances',
      label: `Maintenances (${maintenances.length})`,
      content: <MaintenancesTab maintenances={maintenances} historique={historiqueMaintenance} />,
    },
    {
      id: 'interventions',
      label: `Interventions (${interventions.length})`,
      content: <InterventionsTab interventions={interventions} />,
    },
    { id: 'rapports', label: `Rapports (${rapports.length})`, content: <RapportsTab rapports={rapports} /> },
    { id: 'ctq', label: 'CTQ / Réserves', content: <CtqTab controles={controlesCTQ} reserves={reservesCTQ} /> },
    { id: 'historique', label: 'Historique', content: <HistoriqueTab entrees={journal} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parc" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour au parc
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ascenseur.code}</h1>
              <StatusBadge statut={ascenseur.statutAppareil} />
            </div>
            {ascenseur.nom && <p className="text-sm text-gray-500 mt-1">{ascenseur.nom}</p>}
            <p className="text-sm text-gray-600 mt-1">
              {ascenseur.adresseComplete}, {ascenseur.ville}
            </p>
          </div>
          <div className="text-sm text-gray-600 text-right">
            <p>{client?.raisonSociale ?? 'Client inconnu'}</p>
            <p className="text-gray-400">Contrat {contrat?.numero ?? '—'}</p>
          </div>
        </div>
      </div>

      <OngletsAppareil tabs={tabs} />
    </div>
  );
}
