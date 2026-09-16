/**
 * Écran Planning (section 11) : planning technicien jour/semaine/mois avec
 * réaffectation par glisser-déposer (11.2) dans un onglet, liste des
 * absences (11.3) dans l'autre.
 *
 * Server Component : lecture directe du store via lib/derived/planning.ts,
 * vue/période/filtres pilotés par les query params (?vue=...&date=...) —
 * même convention que app/maintenances/page.tsx. Seule la vue demandée
 * (jour, semaine OU mois) est projetée à chaque requête : le bouton de
 * bascule jour/semaine/mois est un composant client (PlanningVueSwitch) qui
 * navigue via le query param `vue`, plutôt que de précalculer les 3 vues à
 * chaque chargement — un technicien titulaire d'une grande tournée portant
 * plusieurs milliers de maintenances par an (voir lib/derived/planning.ts),
 * matérialiser les 3 fenêtres pour les ~67 techniciens actifs à chaque
 * requête serait coûteux pour un gain surtout perceptible sur la navigation
 * précédent/suivant (qui recharge de toute façon depuis le serveur).
 */

import { CalendarDays } from 'lucide-react';
import { formatDateKey, formatMoisKey } from '@/lib/derived/maintenances-calendrier';
import {
  construireLignesAbsences,
  construireLignesPlanning,
  decalerJourKey,
  filtrerTechniciensPlanning,
  getOptionsFiltresPlanning,
  plageJour,
  plageMois,
  plageSemaine,
  type FiltresPlanningUI,
} from '@/lib/derived/planning';
import { getAllTechniciens } from '@/data/store';
import FiltresPlanningForm from './components/FiltresPlanningForm';
import PlanningTabs from './components/PlanningTabs';
import PlanningVueSwitch from './components/PlanningVueSwitch';
import PlanningBoard from './components/PlanningBoard';
import EnTetePeriode from './components/EnTetePeriode';
import AbsencesListe from './components/AbsencesListe';

export const dynamic = 'force-dynamic';

type Vue = 'jour' | 'semaine' | 'mois';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function libellePeriode(vue: Vue, dateKey: string, debut: Date, fin: Date): string {
  if (vue === 'jour') {
    return majuscule(new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }
  if (vue === 'semaine') {
    const dernierJour = new Date(fin.getTime() - 24 * 60 * 60 * 1000);
    return `Semaine du ${debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${dernierJour.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  }
  return majuscule(debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
}

/** Construit un lien /planning en repartant des query params actuels, avec quelques clés surchargées. */
function construireHref(searchParams: SearchParamsRecord, overrides: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(searchParams)) {
    const v = Array.isArray(valeur) ? valeur[0] : valeur;
    if (v) params.set(cle, v);
  }
  for (const [cle, valeur] of Object.entries(overrides)) {
    if (valeur === undefined) params.delete(cle);
    else params.set(cle, valeur);
  }
  const qs = params.toString();
  return qs ? `/planning?${qs}` : '/planning';
}

interface PlanningPageProps {
  searchParams: SearchParamsRecord;
}

export default function PlanningPage({ searchParams }: PlanningPageProps) {
  const vueParam = param(searchParams, 'vue');
  const vue: Vue = vueParam === 'semaine' || vueParam === 'mois' ? vueParam : 'jour';

  const maintenant = new Date();
  const dateKey = param(searchParams, 'date') ?? formatDateKey(maintenant);

  const { debut, fin } = vue === 'jour' ? plageJour(dateKey) : vue === 'semaine' ? plageSemaine(dateKey) : plageMois(formatMoisKey(new Date(`${dateKey}T00:00:00.000Z`)));

  // Navigation précédent/suivant : ±1 jour, ±7 jours, ou le 1er du mois adjacent (`debut` est déjà
  // le 1er du mois affiché pour la vue "mois", cf. plageMois).
  const dateKeyPrecedent =
    vue === 'jour' ? decalerJourKey(dateKey, -1) : vue === 'semaine' ? decalerJourKey(dateKey, -7) : formatDateKey(new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() - 1, 1)));
  const dateKeySuivant =
    vue === 'jour' ? decalerJourKey(dateKey, 1) : vue === 'semaine' ? decalerJourKey(dateKey, 7) : formatDateKey(new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 1)));
  const dateKeyAujourdhui = formatDateKey(maintenant);

  const filtres: FiltresPlanningUI = {
    technicienId: param(searchParams, 'technicien'),
    tourneeId: param(searchParams, 'tournee'),
    secteurId: param(searchParams, 'secteur'),
  };

  const techniciensActifs = getAllTechniciens().filter((t) => t.actif);
  const techniciensFiltres = filtrerTechniciensPlanning(techniciensActifs, filtres);
  const lignes = construireLignesPlanning(techniciensFiltres, debut, fin, maintenant);
  const options = getOptionsFiltresPlanning();

  const ongletInitial = param(searchParams, 'onglet') === 'absences' ? 'absences' : 'planning';
  const lignesAbsences = construireLignesAbsences(maintenant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          Planning
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {techniciensFiltres.length} technicien{techniciensFiltres.length > 1 ? 's' : ''} affiché{techniciensFiltres.length > 1 ? 's' : ''}
          {techniciensFiltres.length !== techniciensActifs.length ? ` sur ${techniciensActifs.length} au total` : ''}
        </p>
      </div>

      <FiltresPlanningForm options={options} />

      <PlanningTabs
        ongletInitial={ongletInitial}
        planningContent={
          <div className="space-y-4">
            <PlanningVueSwitch
              vue={vue}
              hrefJour={construireHref(searchParams, { vue: undefined })}
              hrefSemaine={construireHref(searchParams, { vue: 'semaine' })}
              hrefMois={construireHref(searchParams, { vue: 'mois' })}
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <EnTetePeriode
                titre={libellePeriode(vue, dateKey, debut, fin)}
                hrefPrecedent={construireHref(searchParams, { date: dateKeyPrecedent })}
                hrefSuivant={construireHref(searchParams, { date: dateKeySuivant })}
                hrefAujourdHui={construireHref(searchParams, { date: dateKeyAujourdhui })}
              />
            </div>

            <PlanningBoard lignes={lignes} />
          </div>
        }
        absencesContent={<AbsencesListe lignes={lignesAbsences} />}
      />
    </div>
  );
}
