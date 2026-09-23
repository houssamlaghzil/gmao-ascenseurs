/**
 * Écran Maintenances (section 6) : vue prioritaire (6.2, en tête de page)
 * et vue calendrier (6.1, dans un onglet séparé — voir MaintenancesTabs).
 *
 * Server Component : lecture directe du store (getAllMaintenances,
 * getAllTypesMaintenanceRef), filtres/pagination/période pilotés par les
 * query params (?technicien=...&pageAVenir=...&mois=...). Aucune mutation
 * sur cet écran : pas de Server Action nécessaire.
 */

import { ClipboardList } from 'lucide-react';
import { CategorieMaintenance } from '@/domain/types';
import { getAllMaintenances, getAllTypesMaintenanceRef, getDateDemo } from '@/data/store';
import {
  construireGroupesPriorite,
  filtrerMaintenances,
  getOptionsFiltresMaintenances,
  paginer,
  type FiltresMaintenancesUI,
} from '@/lib/derived/maintenances-liste';
import {
  compterParJour,
  compterParMois,
  decalerMoisKey,
  decalerSemaineKey,
  decomposerMoisKey,
  formatDateKey,
  formatMoisKey,
  lundiDeLaSemaine,
  plageGrilleMois,
} from '@/lib/derived/maintenances-calendrier';
import FiltresMaintenancesForm from './components/FiltresMaintenancesForm';
import MaintenancesTabs, { type OngletMaintenances } from './components/MaintenancesTabs';
import VuePrioritaire from './components/VuePrioritaire';
import VueCalendrier from './components/VueCalendrier';

export const dynamic = 'force-dynamic';

const TAILLE_PAGE_URGENT = 10; // en retard / cette semaine : panneaux d'attention, compacts
const TAILLE_PAGE_A_VENIR = 20; // à venir : liste parcourable

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParamsRecord, cle: string): string | undefined {
  const v = searchParams[cle];
  return Array.isArray(v) ? v[0] : v;
}

/** Construit un lien /maintenances en repartant des query params actuels, avec quelques clés surchargées. */
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
  return qs ? `/maintenances?${qs}` : '/maintenances';
}

interface MaintenancesPageProps {
  searchParams: SearchParamsRecord;
}

export default function MaintenancesPage({ searchParams }: MaintenancesPageProps) {
  const filtres: FiltresMaintenancesUI = {
    technicienId: param(searchParams, 'technicien'),
    tourneeId: param(searchParams, 'tournee'),
    contratId: param(searchParams, 'contrat'),
    categorie: param(searchParams, 'categorie') as CategorieMaintenance | undefined,
  };

  const maintenant = getDateDemo();
  const toutesLesMaintenances = getAllMaintenances();
  const maintenancesFiltrees = filtrerMaintenances(toutesLesMaintenances, filtres);

  // --- 6.2 Vue prioritaire : en retard > cette semaine > à venir, chacune paginée ---
  const groupes = construireGroupesPriorite(maintenancesFiltrees, maintenant);
  const enRetardPage = paginer(groupes.enRetard, Number(param(searchParams, 'pageRetard') ?? '1') || 1, TAILLE_PAGE_URGENT);
  const cetteSemainePage = paginer(groupes.cetteSemaine, Number(param(searchParams, 'pageSemaine') ?? '1') || 1, TAILLE_PAGE_URGENT);
  const aVenirPage = paginer(groupes.aVenir, Number(param(searchParams, 'pageAVenir') ?? '1') || 1, TAILLE_PAGE_A_VENIR);

  // --- 6.1 Vue calendrier : compteurs par catégorie, jamais les objets Maintenance individuels ---
  const moisActuelKey = formatMoisKey(maintenant);
  const semaineActuelleKey = formatDateKey(lundiDeLaSemaine(maintenant));
  const moisAffiche = param(searchParams, 'mois') ?? moisActuelKey;
  const semaineAffichee = param(searchParams, 'semaine') ?? semaineActuelleKey;
  const granulariteInitiale = (param(searchParams, 'granularite') as 'annee' | 'mois' | 'semaine' | undefined) ?? 'mois';
  const ongletInitial: OngletMaintenances = param(searchParams, 'onglet') === 'calendrier' ? 'calendrier' : 'prioritaire';

  const { annee, moisIndex0 } = decomposerMoisKey(moisAffiche);
  const compteursAnnee = compterParMois(maintenancesFiltrees, annee);
  const { debut: debutGrilleMois, fin: finGrilleMois } = plageGrilleMois(annee, moisIndex0);
  const compteursMois = compterParJour(maintenancesFiltrees, debutGrilleMois, finGrilleMois);
  const debutSemaine = new Date(`${semaineAffichee}T00:00:00.000Z`);
  const finSemaine = new Date(debutSemaine.getTime() + 7 * 24 * 60 * 60 * 1000);
  const compteursSemaine = compterParJour(maintenancesFiltrees, debutSemaine, finSemaine);

  const options = getOptionsFiltresMaintenances();
  const typesMaintenanceRef = getAllTypesMaintenanceRef();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          Maintenances
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {maintenancesFiltrees.length.toLocaleString('fr-FR')} maintenance{maintenancesFiltrees.length > 1 ? 's' : ''}
          {maintenancesFiltrees.length !== toutesLesMaintenances.length
            ? ` sur ${toutesLesMaintenances.length.toLocaleString('fr-FR')} au total`
            : ' pour l\'année en cours'}
        </p>
      </div>

      <FiltresMaintenancesForm options={options} />

      <MaintenancesTabs
        ongletInitial={ongletInitial}
        prioritaireContent={
          <VuePrioritaire
            enRetard={enRetardPage}
            cetteSemaine={cetteSemainePage}
            aVenir={aVenirPage}
            typesMaintenanceRef={typesMaintenanceRef}
            searchParams={searchParams}
          />
        }
        calendrierContent={
          <VueCalendrier
            granulariteInitiale={granulariteInitiale}
            compteursAnnee={compteursAnnee}
            moisAffiche={moisAffiche}
            compteursMois={compteursMois}
            semaineAffichee={semaineAffichee}
            compteursSemaine={compteursSemaine}
            moisPrecedentHref={construireHref(searchParams, { mois: decalerMoisKey(moisAffiche, -1), onglet: 'calendrier', granularite: 'mois' })}
            moisSuivantHref={construireHref(searchParams, { mois: decalerMoisKey(moisAffiche, 1), onglet: 'calendrier', granularite: 'mois' })}
            semainePrecedenteHref={construireHref(searchParams, {
              semaine: decalerSemaineKey(semaineAffichee, -1),
              onglet: 'calendrier',
              granularite: 'semaine',
            })}
            semaineSuivanteHref={construireHref(searchParams, {
              semaine: decalerSemaineKey(semaineAffichee, 1),
              onglet: 'calendrier',
              granularite: 'semaine',
            })}
            aujourdHuiHref={construireHref(searchParams, { mois: moisActuelKey, semaine: semaineActuelleKey, onglet: 'calendrier' })}
          />
        }
      />
    </div>
  );
}
