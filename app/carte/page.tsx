/**
 * Carte (section 13) — plan schématique SVG/CSS (pas de Leaflet/Mapbox/Google
 * Maps : aucune tuile réseau, aucune clé API dans une maquette). Server
 * Component : lecture directe du store, filtres pilotés par les query params
 * (?technicien=...&statut=...). Vu le volume (4 348 appareils), seuls les
 * appareils en anomalie ou avec une intervention urgente ouverte sont
 * affichés par défaut (voir lib/derived/carte.ts), avec une option explicite
 * pour tous les afficher.
 */

import { MapPin, AlertTriangle, Users, Route as RouteIcon } from 'lucide-react';
import { StatutAppareil, StatutPresenceTechnicien } from '@/domain/types';
import {
  getPointsCarteAppareils,
  filtrerPointsCarteAppareils,
  getPointsCarteTechniciens,
  getZonesCarte,
  getTourneesDuJourCarte,
  getOptionsFiltresCarte,
  type FiltresCarteUI,
} from '@/lib/derived/carte';
import StatCard from '@/components/StatCard';
import FiltresCarteForm from './components/FiltresCarteForm';
import CarteSchematique from './components/CarteSchematique';

export const dynamic = 'force-dynamic';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

interface CartePageProps {
  searchParams: SearchParamsRecord;
}

export default function CartePage({ searchParams }: CartePageProps) {
  const filtres: FiltresCarteUI = {
    technicienId: param(searchParams, 'technicien'),
    statutAppareil: param(searchParams, 'statut') as StatutAppareil | undefined,
    clientId: param(searchParams, 'client'),
    interventionId: param(searchParams, 'intervention'),
    interventionsUrgentesUniquement: param(searchParams, 'urgent') === '1',
    maintenancesEnRetardUniquement: param(searchParams, 'retardMaintenance') === '1',
    afficherTousLesAppareils: param(searchParams, 'tous') === '1',
  };

  const tousLesPoints = getPointsCarteAppareils();
  const pointsAffiches = filtrerPointsCarteAppareils(tousLesPoints, filtres);

  const techniciensBruts = getPointsCarteTechniciens();
  const techniciens = filtres.technicienId ? techniciensBruts.filter((t) => t.technicienId === filtres.technicienId) : techniciensBruts;

  const tournees = getTourneesDuJourCarte().filter((t) => !filtres.technicienId || t.technicienId === filtres.technicienId);
  const zones = getZonesCarte();
  const options = getOptionsFiltresCarte();

  const nombreUrgences = pointsAffiches.filter((p) => p.interventionUrgenteId).length;
  const nombreTechniciensEnLigne = techniciens.filter((t) => t.statutPresence === StatutPresenceTechnicien.EN_LIGNE).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Carte
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {pointsAffiches.length.toLocaleString('fr-FR')} appareil{pointsAffiches.length > 1 ? 's' : ''} affiché{pointsAffiches.length > 1 ? 's' : ''}
          {!filtres.afficherTousLesAppareils && (
            <> sur {tousLesPoints.length.toLocaleString('fr-FR')} au total — seuls les appareils en anomalie ou avec une intervention urgente ouverte sont affichés par défaut.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Appareils affichés" value={pointsAffiches.length} icon={<MapPin className="h-6 w-6" />} colorClass="text-blue-600" />
        <StatCard title="Interventions urgentes" value={nombreUrgences} icon={<AlertTriangle className="h-6 w-6" />} colorClass="text-rose-600" />
        <StatCard title="Techniciens en ligne" value={nombreTechniciensEnLigne} icon={<Users className="h-6 w-6" />} colorClass="text-emerald-600" subtitle={`${techniciens.length} suivi${techniciens.length > 1 ? 's' : ''}`} />
        <StatCard title="Tournées du jour" value={tournees.length} icon={<RouteIcon className="h-6 w-6" />} colorClass="text-indigo-600" />
      </div>

      <FiltresCarteForm options={options} />

      <CarteSchematique points={pointsAffiches} techniciens={techniciens} zones={zones} tournees={tournees} />
    </div>
  );
}
