/**
 * Carte (section 13) — carte interactive Leaflet + tuiles OpenStreetMap
 * (voir app/carte/components/CarteInteractive.tsx). Server Component :
 * lecture directe du store, filtres pilotés par les query params
 * (?technicien=...&statut=...).
 *
 * Vu le volume (4 348 appareils), on n'affiche jamais tout le parc d'un
 * coup :
 *   - sans filtre explicite, seuls les appareils en panne ou à l'arrêt sont
 *     affichés par défaut (~260) — c'est la vue "ce qui pose problème" ;
 *   - dès qu'un filtre explicite est posé (statut, client, technicien,
 *     intervention urgente, maintenance en retard, ou "tous les appareils"),
 *     on repart de la sélection habituelle (voir lib/derived/carte.ts) ;
 *   - dans tous les cas, la carte est plafonnée à PLAFOND_MARQUEURS points,
 *     avec un message explicite en cas de troncature.
 */

import { MapPin, AlertTriangle, Users, Route as RouteIcon } from 'lucide-react';
import { StatutAppareil, StatutPresenceTechnicien } from '@/domain/types';
import {
  getPointsCarteAppareils,
  filtrerPointsCarteAppareils,
  getPointsCarteTechniciens,
  getTourneesDuJourCarte,
  getOptionsFiltresCarte,
  type FiltresCarteUI,
} from '@/lib/derived/carte';
import StatCard from '@/components/StatCard';
import FiltresCarteForm from './components/FiltresCarteForm';
import CarteInteractive from './components/CarteInteractive';
import { avecCoordonneesReelles } from './lib/points-gps';

export const dynamic = 'force-dynamic';

/** Nombre maximal de marqueurs rendus sur la carte, quel que soit le filtre. */
const PLAFOND_MARQUEURS = 500;

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
  const pointsSelectionnes = filtrerPointsCarteAppareils(tousLesPoints, filtres);

  // Aucun filtre explicite posé : on ne montre que ce qui pose problème
  // (en panne + à l'arrêt) plutôt que la sélection large par défaut de
  // lib/derived/carte.ts (anomalie OU intervention urgente), pour ne pas
  // surcharger la carte dès l'arrivée sur la page.
  const aucunFiltreExplicite =
    !filtres.technicienId &&
    !filtres.statutAppareil &&
    !filtres.clientId &&
    !filtres.interventionId &&
    !filtres.interventionsUrgentesUniquement &&
    !filtres.maintenancesEnRetardUniquement &&
    !filtres.afficherTousLesAppareils;

  const pointsAffiches = aucunFiltreExplicite
    ? pointsSelectionnes.filter((p) => p.statut === StatutAppareil.EN_PANNE || p.statut === StatutAppareil.A_L_ARRET)
    : pointsSelectionnes;

  const carteTronquee = pointsAffiches.length > PLAFOND_MARQUEURS;
  const pointsCarte = avecCoordonneesReelles(pointsAffiches.slice(0, PLAFOND_MARQUEURS));

  const techniciensBruts = getPointsCarteTechniciens();
  const techniciens = filtres.technicienId ? techniciensBruts.filter((t) => t.technicienId === filtres.technicienId) : techniciensBruts;

  const tournees = getTourneesDuJourCarte().filter((t) => !filtres.technicienId || t.technicienId === filtres.technicienId);
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
          {pointsAffiches.length.toLocaleString('fr-FR')} appareil{pointsAffiches.length > 1 ? 's' : ''} affiché{pointsAffiches.length > 1 ? 's' : ''} sur{' '}
          {tousLesPoints.length.toLocaleString('fr-FR')} au total
          {aucunFiltreExplicite && <> — seuls les appareils en panne ou à l&apos;arrêt sont affichés par défaut.</>}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Appareils affichés" value={pointsCarte.length} icon={<MapPin className="h-6 w-6" />} colorClass="text-blue-600" />
        <StatCard title="Interventions urgentes" value={nombreUrgences} icon={<AlertTriangle className="h-6 w-6" />} colorClass="text-rose-600" />
        <StatCard title="Techniciens en ligne" value={nombreTechniciensEnLigne} icon={<Users className="h-6 w-6" />} colorClass="text-emerald-600" subtitle={`${techniciens.length} suivi${techniciens.length > 1 ? 's' : ''}`} />
        <StatCard title="Tournées du jour" value={tournees.length} icon={<RouteIcon className="h-6 w-6" />} colorClass="text-indigo-600" />
      </div>

      <FiltresCarteForm options={options} />

      {carteTronquee && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Affichage limité à {PLAFOND_MARQUEURS.toLocaleString('fr-FR')} points sur {pointsAffiches.length.toLocaleString('fr-FR')} correspondant à ces filtres. Affinez la sélection (technicien, statut, client…) pour voir les appareils restants.
        </div>
      )}

      <CarteInteractive points={pointsCarte} />
    </div>
  );
}
