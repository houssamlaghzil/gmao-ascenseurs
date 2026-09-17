/**
 * Fiche technicien (section 12) — Server Component : toutes les jointures
 * sont faites ici, une seule fois, puis transmises aux onglets (Server
 * Components) rendus par le composant client OngletsTechnicien. Même
 * convention que app/parc/[id]/page.tsx.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { StatutAbsence } from '@/domain/types';
import { LienTechnicien } from '@/components/Liens';
import {
  getAllAbsencesTechnicien,
  getAscenseursByTourneeId,
  getElementsFileSynchronisationByTechnicienId,
  getInterventionsByTechnicienId,
  getMaintenancesByTechnicienId,
  getPositionByTechnicienId,
  getRapportsByTechnicienId,
  getSessionActiveDuTechnicien,
  getTechnicienById,
  getTourneesByTechnicienId,
} from '@/data/store';
import { getLigneTechnicien, getEtatSynchronisationTechnicien } from '@/lib/derived/techniciens-liste';
import { getTachesPlanningTechnicien } from '@/lib/derived/planning';
import { paginer } from '@/lib/derived/maintenances-liste';
import OngletsTechnicien, { type OngletTechnicien } from './components/OngletsTechnicien';
import SyntheseTab from './components/SyntheseTab';
import PlanningAVenirTab from './components/PlanningAVenirTab';
import InterventionsTechnicienTab from './components/InterventionsTechnicienTab';
import MaintenancesTechnicienTab from './components/MaintenancesTechnicienTab';
import RapportsTechnicienTab from './components/RapportsTechnicienTab';
import MobileGeolocalisationTab from './components/MobileGeolocalisationTab';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE_MAINTENANCES = 25;
const FENETRE_PLANNING_JOURS = 7;
const LIMITE_PLANNING_AFFICHEE = 20;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface FicheTechnicienPageProps {
  params: { id: string };
  searchParams: SearchParamsRecord;
}

export default function FicheTechnicienPage({ params, searchParams }: FicheTechnicienPageProps) {
  const technicien = getTechnicienById(params.id);
  if (!technicien) notFound();

  const ligne = getLigneTechnicien(technicien.id)!;
  const tournees = getTourneesByTechnicienId(technicien.id);
  const nombreAppareilsCouverts = tournees.reduce((total, t) => total + getAscenseursByTourneeId(t.id).length, 0);

  const maintenant = new Date();
  const dansSeptJours = new Date(maintenant.getTime() + FENETRE_PLANNING_JOURS * 24 * 60 * 60 * 1000);
  const tachesAVenir = getTachesPlanningTechnicien(technicien.id, maintenant, dansSeptJours, maintenant);

  const interventions = getInterventionsByTechnicienId(technicien.id);
  const maintenances = getMaintenancesByTechnicienId(technicien.id);
  const maintenancesTriees = [...maintenances].sort((a, b) => new Date(b.datePrevue).getTime() - new Date(a.datePrevue).getTime());
  const pageMaintenances = paginer(maintenancesTriees, Number(param(searchParams, 'pageMaintenances') ?? '1') || 1, TAILLE_PAGE_MAINTENANCES);
  const rapports = getRapportsByTechnicienId(technicien.id);
  const absences = getAllAbsencesTechnicien().filter((a) => a.technicienId === technicien.id);

  const position = getPositionByTechnicienId(technicien.id);
  const session = getSessionActiveDuTechnicien(technicien.id);
  const etatSynchronisation = getEtatSynchronisationTechnicien(technicien.id);
  const elementsSynchronisation = getElementsFileSynchronisationByTechnicienId(technicien.id);

  const ongletInitial = param(searchParams, 'onglet') ?? 'synthese';

  const tabs: OngletTechnicien[] = [
    {
      id: 'synthese',
      label: 'Synthèse',
      content: (
        <SyntheseTab
          ligne={ligne}
          tournees={tournees}
          nombreAppareilsCouverts={nombreAppareilsCouverts}
          absencesActives={absences.filter((a) => a.statut !== StatutAbsence.TERMINEE).length}
        />
      ),
    },
    {
      id: 'planning',
      label: `Planning (${tachesAVenir.length})`,
      content: <PlanningAVenirTab technicienId={technicien.id} taches={tachesAVenir.slice(0, LIMITE_PLANNING_AFFICHEE)} total={tachesAVenir.length} />,
    },
    {
      id: 'interventions',
      label: `Interventions (${interventions.length})`,
      content: <InterventionsTechnicienTab interventions={interventions} />,
    },
    {
      id: 'maintenances',
      label: `Maintenances (${maintenances.length})`,
      content: (
        <MaintenancesTechnicienTab
          technicienId={technicien.id}
          maintenances={pageMaintenances.items}
          pageActuelle={pageMaintenances.pageActuelle}
          totalPages={pageMaintenances.totalPages}
          total={pageMaintenances.total}
        />
      ),
    },
    { id: 'rapports', label: `Rapports (${rapports.length})`, content: <RapportsTechnicienTab rapports={rapports} /> },
    {
      id: 'mobile',
      label: 'Mobile & géolocalisation',
      content: (
        <MobileGeolocalisationTab
          session={session}
          etatSynchronisation={etatSynchronisation}
          elementsSynchronisation={elementsSynchronisation}
          position={position}
          tourneeVille={tournees[0]?.ville}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/techniciens" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux techniciens
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{technicien.nomComplet}</h1>
            <p className="text-sm text-gray-600 mt-1">{technicien.specialite}</p>
            <LienTechnicien id={technicien.id} ton="accentue" className="mt-2 text-sm">
              Voir le périmètre d&apos;appareils
            </LienTechnicien>
          </div>
          <div className="text-sm text-gray-600 text-right">
            {technicien.telephone && <p>{technicien.telephone}</p>}
            {technicien.email && <p className="text-gray-400">{technicien.email}</p>}
          </div>
        </div>
      </div>

      <OngletsTechnicien ongletInitial={ongletInitial} tabs={tabs} />
    </div>
  );
}
