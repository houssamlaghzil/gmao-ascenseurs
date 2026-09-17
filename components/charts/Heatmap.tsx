'use client';

/**
 * Heatmap calendaire mixte — réalisé + prévisionnel.
 *
 * Grille façon « contributions » couvrant trois mois écoulés, aujourd'hui et
 * trois mois à venir. Les données arrivent déjà alignées sur des semaines
 * civiles (voir `getActiviteParJour` : premier jour lundi, dernier dimanche,
 * longueur multiple de 7), donc le découpage en colonnes de 7 est juste par
 * construction — plus de ligne « L » qui ne serait pas un lundi ni de dernière
 * colonne tronquée.
 *
 * Trois teintes, chacune avec sa propre gradation :
 *   - passé      : indigo  (#c7d2fe → #6366f1), 0 = #f3f4f6
 *   - aujourd'hui: émeraude (#a7f3d0 → #047857) + anneau permanent, repère
 *                  visible même sans activité
 *   - futur      : ambre   (#fde68a → #d97706), 0 = #f3f4f6
 *
 * CONTRAT DOM POUR LE PARENT : la case du jour courant porte
 * `data-scroll-cible="true"`. Un conteneur externe (par exemple `ZoneDefilante`)
 * peut la retrouver via `element.querySelector('[data-scroll-cible="true"]')`
 * pour centrer son défilement horizontal dessus sur mobile. Ce composant ne
 * crée lui-même aucun scroll : il rend sa grille à sa largeur naturelle et
 * laisse volontairement déborder — la gestion du débordement appartient au
 * conteneur parent.
 */

import { useMemo, useState } from 'react';
import { CategorieMaintenance } from '@/domain/types';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import type { JourActivite } from '@/lib/derived/dashboard';

interface HeatmapProps {
  data: JourActivite[];
  className?: string;
}

/** Gradations à quatre paliers : index 0 = activité nulle. */
const TEINTES_PASSE = ['#f3f4f6', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'];
const TEINTES_FUTUR = ['#f3f4f6', '#fde68a', '#fcd34d', '#fbbf24', '#d97706'];
/** Aujourd'hui ne descend jamais au gris : la case reste repérable à zéro activité. */
const TEINTES_AUJOURDHUI = ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#047857'];

const COULEUR_HORS_PLAGE = '#fafafa';

/** Convertit une clé `yyyy-mm-dd` en Date locale (éviter le parsing UTC de `new Date('...')`). */
function lireJourLocal(cle: string): Date {
  const [annee, mois, jour] = cle.split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}

/** Palier 1..4 d'une valeur non nulle rapportée à son maximum. */
function palier(valeur: number, maximum: number): number {
  if (valeur <= 0) return 0;
  const intensite = valeur / Math.max(maximum, 1);
  if (intensite < 0.25) return 1;
  if (intensite < 0.5) return 2;
  if (intensite < 0.75) return 3;
  return 4;
}

export default function Heatmap({ data, className = '' }: HeatmapProps) {
  const [jourSurvole, setJourSurvole] = useState<JourActivite | null>(null);
  const [positionTooltip, setPositionTooltip] = useState({ x: 0, y: 0 });

  const { semaines, maxPasse, maxFutur, libellesMois } = useMemo(() => {
    // Découpage en colonnes de 7 : la donnée commence un lundi, donc la ligne 0
    // est bien la ligne des lundis.
    const colonnes: JourActivite[][] = [];
    for (let i = 0; i < data.length; i += 7) colonnes.push(data.slice(i, i + 7));

    const comptes = data.filter((j) => !j.horsPlage);
    const passe = Math.max(1, ...comptes.filter((j) => j.temporalite !== 'futur').map((j) => j.count));
    const futur = Math.max(1, ...comptes.filter((j) => j.temporalite === 'futur').map((j) => j.count));

    // Libellés de mois : calculés depuis les vraies dates et posés sur la
    // première colonne où le mois apparaît — un mois ne commence presque jamais
    // un lundi, d'où ce repérage colonne par colonne plutôt qu'un pas fixe.
    const libelles: (string | null)[] = colonnes.map(() => null);
    const moisDejaVus = new Set<string>();
    colonnes.forEach((colonne, indexColonne) => {
      for (const jour of colonne) {
        const mois = jour.date.slice(0, 7);
        if (moisDejaVus.has(mois)) continue;
        // Une seule étiquette par colonne : si la colonne est déjà prise (cas du
        // tout premier bloc, à cheval sur deux mois), le mois reste « non vu »
        // et sera étiqueté sur la colonne suivante plutôt que perdu.
        if (libelles[indexColonne] !== null) continue;
        moisDejaVus.add(mois);
        const date = lireJourLocal(jour.date);
        const court = date.toLocaleDateString('fr-FR', { month: 'short' });
        // L'année n'est rappelée qu'en janvier : c'est le seul endroit où la
        // plage change de millésime.
        libelles[indexColonne] =
          date.getMonth() === 0 ? `${court} ${String(date.getFullYear()).slice(2)}` : court;
      }
    });

    return { semaines: colonnes, maxPasse: passe, maxFutur: futur, libellesMois: libelles };
  }, [data]);

  const couleurDe = (jour: JourActivite): string => {
    if (jour.horsPlage) return COULEUR_HORS_PLAGE;
    if (jour.temporalite === 'aujourdhui') return TEINTES_AUJOURDHUI[palier(jour.count, maxPasse)];
    if (jour.temporalite === 'futur') return TEINTES_FUTUR[palier(jour.count, maxFutur)];
    return TEINTES_PASSE[palier(jour.count, maxPasse)];
  };

  const survoler = (jour: JourActivite, e: React.MouseEvent) => {
    setJourSurvole(jour);
    setPositionTooltip({ x: e.clientX, y: e.clientY });
  };

  const formaterDate = (cle: string) =>
    lireJourLocal(cle).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const formaterCategories = (categories: CategorieMaintenance[]) =>
    categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(', ');

  return (
    <div className={`relative overflow-visible ${className}`}>
      <div className="flex gap-1 overflow-visible">
        {/* Colonne des jours de semaine : la donnée démarrant un lundi, ces
            libellés correspondent réellement aux lignes en face. */}
        <div className="flex flex-col gap-[3px] pr-2 pt-5 text-xs text-gray-500">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((jour, i) => (
            <span key={i} className="h-3 leading-3">
              {jour}
            </span>
          ))}
        </div>

        <div className="flex flex-col overflow-visible">
          {/* Étiquettes de mois : même structure de colonnes que la grille, donc
              alignées par construction. Positionnement absolu pour qu'un libellé
              plus large que ses 12 px ne décale pas les colonnes. */}
          <div className="flex h-5 gap-[3px]">
            {semaines.map((_, indexColonne) => (
              <div key={indexColonne} className="relative w-3">
                {libellesMois[indexColonne] && (
                  <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-4 text-gray-500">
                    {libellesMois[indexColonne]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Grille : largeur naturelle, aucun scroll interne (voir en-tête). */}
          <div className="flex gap-[3px]">
            {semaines.map((semaine, indexColonne) => (
              <div key={indexColonne} className="flex flex-col gap-[3px]">
                {semaine.map((jour) => {
                  const estAujourdhui = jour.temporalite === 'aujourdhui';
                  return (
                    <div
                      key={jour.date}
                      data-scroll-cible={estAujourdhui ? 'true' : undefined}
                      data-date={jour.date}
                      aria-hidden={jour.horsPlage ? true : undefined}
                      className={[
                        'h-3 w-3 rounded-sm transition-all duration-150',
                        // Les cases de complément ne sont ni survolables ni cliquables.
                        jour.horsPlage
                          ? 'pointer-events-none opacity-60'
                          : 'cursor-pointer hover:ring-2 hover:ring-offset-1',
                        jour.horsPlage
                          ? ''
                          : jour.temporalite === 'futur'
                            ? 'hover:ring-amber-400'
                            : 'hover:ring-indigo-400',
                        // Anneau permanent : aujourd'hui reste repérable à zéro activité.
                        estAujourdhui ? 'ring-2 ring-emerald-600 ring-offset-1' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ backgroundColor: couleurDe(jour) }}
                      onMouseEnter={jour.horsPlage ? undefined : (e) => survoler(jour, e)}
                      onMouseLeave={jour.horsPlage ? undefined : () => setJourSurvole(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende : une gradation par temporalité, aujourd'hui restant un repère
          ponctuel plutôt qu'une échelle. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Réalisé</span>
          <div className="flex gap-[2px]">
            {TEINTES_PASSE.map((couleur) => (
              <div key={couleur} className="h-3 w-3 rounded-sm" style={{ backgroundColor: couleur }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>Planifié</span>
          <div className="flex gap-[2px]">
            {TEINTES_FUTUR.map((couleur) => (
              <div key={couleur} className="h-3 w-3 rounded-sm" style={{ backgroundColor: couleur }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm ring-2 ring-emerald-600 ring-offset-1"
            style={{ backgroundColor: TEINTES_AUJOURDHUI[1] }}
          />
          <span>Aujourd&apos;hui</span>
        </div>
      </div>

      {jourSurvole && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: positionTooltip.x + 10, top: positionTooltip.y - 70 }}
        >
          <div className="mb-1 font-semibold">{formaterDate(jourSurvole.date)}</div>
          {jourSurvole.temporalite === 'futur' ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-amber-300">
                {jourSurvole.planifiees} maintenance{jourSurvole.planifiees > 1 ? 's' : ''} planifiée
                {jourSurvole.planifiees > 1 ? 's' : ''}
              </span>
              {jourSurvole.categoriesPlanifiees.length > 0 && (
                <span className="text-gray-300">{formaterCategories(jourSurvole.categoriesPlanifiees)}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span>
                {jourSurvole.count} événement{jourSurvole.count > 1 ? 's' : ''}
              </span>
              <span className="text-rose-300">
                {jourSurvole.pannes} panne{jourSurvole.pannes > 1 ? 's' : ''}
              </span>
              <span className="text-emerald-300">
                {jourSurvole.reparations} réparation{jourSurvole.reparations > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
