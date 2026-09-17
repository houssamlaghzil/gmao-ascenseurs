/**
 * Fiche appareil (palier 3 du drill-down) — servie sur /appareils/<id>.
 *
 * L'adresse a changé pour lever une ambiguïté de vocabulaire coûteuse :
 * `/parc` désigne la liste des *appareils*, alors qu'un `ParcAscenseurs` est
 * un *site*. La fiche d'un appareil vit donc désormais sous /appareils/, et
 * /parc/<id> se contente de rediriger (aucun lien existant ne casse).
 *
 * Server Component : toutes les jointures sont faites ici, une seule fois,
 * puis transmises aux onglets (déjà écrits, réutilisés tels quels depuis
 * app/parc/[id]/components) et à la sidebar contextuelle de site.
 *
 * Mise en page : contenu principal + colonne de contexte à droite, qui passe
 * sous le contenu en dessous de `lg`.
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
import { LienClient, LienContrat, LienSite } from '@/components/Liens';
import { calculerDisponibilitePourcent } from '@/lib/derived/disponibilite';
import { trouverProchaineMaintenancePlanifiee } from '@/lib/derived/maintenances-appareil';
// Les sept onglets existent déjà et restent à leur place : ils sont importés,
// jamais dupliqués ni déplacés.
import OngletsAppareil, { OngletAppareil } from '@/app/parc/[id]/components/OngletsAppareil';
import SyntheseTab from '@/app/parc/[id]/components/SyntheseTab';
import FicheTechniqueTab from '@/app/parc/[id]/components/FicheTechniqueTab';
import MaintenancesTab from '@/app/parc/[id]/components/MaintenancesTab';
import InterventionsTab from '@/app/parc/[id]/components/InterventionsTab';
import RapportsTab from '@/app/parc/[id]/components/RapportsTab';
import CtqTab from '@/app/parc/[id]/components/CtqTab';
import HistoriqueTab from '@/app/parc/[id]/components/HistoriqueTab';
import SidebarSite from './components/SidebarSite';
import HistoriqueEtats from './components/HistoriqueEtats';

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
    { id: 'historique', label: 'Journal', content: <HistoriqueTab entrees={journal} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parc" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux appareils
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ascenseur.code}</h1>
              <StatusBadge statut={ascenseur.statutAppareil} />
            </div>
            {ascenseur.nom && <p className="mt-1 text-sm text-gray-500">{ascenseur.nom}</p>}
            {/* `adresseComplete` porte déjà le code postal et la ville : les
                réafficher produisait « 75 rue Jean Jaurès, 06000 Nice, 06000 Nice ». */}
            <p className="mt-1 text-sm text-gray-600">{ascenseur.adresseComplete}</p>
            {parc && (
              <p className="mt-1 text-sm text-gray-500">
                Site <LienSite id={parc.id}>{parc.nom}</LienSite>
              </p>
            )}
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>
              {client ? <LienClient id={client.id} ton="sobre">{client.raisonSociale}</LienClient> : 'Client inconnu'}
            </p>
            <p className="mt-1 text-gray-400">
              {contrat ? (
                <>
                  Contrat <LienContrat id={contrat.id} ton="sobre">{contrat.numero}</LienContrat>
                </>
              ) : (
                'Aucun contrat'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <OngletsAppareil tabs={tabs} />
          <HistoriqueEtats ascenseur={ascenseur} entrees={journal} interventions={interventions} />
        </div>

        <SidebarSite
          ascenseur={ascenseur}
          parc={parc}
          client={client}
          contrat={contrat}
          technicien={technicien}
          tournee={tournee}
        />
      </div>
    </div>
  );
}
