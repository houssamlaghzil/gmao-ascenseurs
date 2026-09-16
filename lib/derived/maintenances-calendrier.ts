/**
 * Agrégation calendaire pour la vue calendrier des maintenances (section
 * 6.1) : bascule annuelle/mensuelle/hebdomadaire.
 *
 * Avec ~31 600 occurrences pour l'année en cours, la vue calendrier n'expose
 * jamais les objets Maintenance individuels au client — seulement des
 * COMPTEURS par jour/mois et par catégorie (quelques dizaines d'entrées,
 * quel que soit le volume filtré en amont). Le détail d'un passage précis
 * reste la responsabilité de la vue prioritaire (section 6.2), qui liste et
 * pagine les objets complets.
 */

import { CategorieMaintenance, Maintenance } from '@/domain/types';

const JOUR_MS = 24 * 60 * 60 * 1000;

function compteursCategorieVides(): Record<CategorieMaintenance, number> {
  return {
    [CategorieMaintenance.PERIODIQUE]: 0,
    [CategorieMaintenance.CABLE]: 0,
    [CategorieMaintenance.PARACHUTE]: 0,
    [CategorieMaintenance.NETTOYAGE]: 0,
    [CategorieMaintenance.AUTRE]: 0,
  };
}

/** Clé YYYY-MM-DD à partir d'un ISO datePrevue (toujours minuit UTC dans les données). */
function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Clé YYYY-MM d'une Date construite en UTC. */
export function formatMoisKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Clé YYYY-MM-DD d'une Date construite en UTC. */
export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface CompteurJour {
  dateKey: string; // YYYY-MM-DD
  total: number;
  parCategorie: Record<CategorieMaintenance, number>;
}

/** Compte les maintenances (datePrevue) jour par jour sur l'intervalle [debut, fin[ (fin exclue). */
export function compterParJour(maintenances: Maintenance[], debut: Date, fin: Date): CompteurJour[] {
  const jours: CompteurJour[] = [];
  const index = new Map<string, CompteurJour>();
  for (let t = debut.getTime(); t < fin.getTime(); t += JOUR_MS) {
    const compteur: CompteurJour = { dateKey: formatDateKey(new Date(t)), total: 0, parCategorie: compteursCategorieVides() };
    jours.push(compteur);
    index.set(compteur.dateKey, compteur);
  }
  for (const m of maintenances) {
    const compteur = index.get(toDateKey(m.datePrevue));
    if (!compteur) continue;
    compteur.total += 1;
    for (const categorie of m.categories) compteur.parCategorie[categorie] += 1;
  }
  return jours;
}

export interface CompteurMois {
  moisKey: string; // YYYY-MM
  total: number;
  parCategorie: Record<CategorieMaintenance, number>;
}

/** Compte les maintenances (datePrevue) mois par mois sur une année donnée. */
export function compterParMois(maintenances: Maintenance[], annee: number): CompteurMois[] {
  const mois: CompteurMois[] = Array.from({ length: 12 }, (_, i) => ({
    moisKey: `${annee}-${String(i + 1).padStart(2, '0')}`,
    total: 0,
    parCategorie: compteursCategorieVides(),
  }));
  for (const m of maintenances) {
    const dateKey = toDateKey(m.datePrevue);
    if (!dateKey.startsWith(String(annee))) continue;
    const compteur = mois[Number(dateKey.slice(5, 7)) - 1];
    compteur.total += 1;
    for (const categorie of m.categories) compteur.parCategorie[categorie] += 1;
  }
  return mois;
}

/** Lundi 00:00 UTC de la semaine contenant `date`. */
export function lundiDeLaSemaine(date: Date): Date {
  const jour = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const jourSemaineISO = jour.getUTCDay() === 0 ? 7 : jour.getUTCDay(); // 1 = lundi ... 7 = dimanche
  jour.setUTCDate(jour.getUTCDate() - (jourSemaineISO - 1));
  return jour;
}

/**
 * Plage [debut, fin[ de la grille mensuelle affichée (section 6.1, vue
 * "mois") : du lundi de la semaine contenant le 1er du mois au dimanche
 * (inclus) de la semaine contenant le dernier jour du mois. Garantit que
 * chaque semaine affichée dans la grille est entièrement comptée, y compris
 * les jours des mois adjacents visibles en début/fin de grille.
 */
export function plageGrilleMois(annee: number, moisIndex0: number): { debut: Date; fin: Date } {
  const premierJour = new Date(Date.UTC(annee, moisIndex0, 1));
  const dernierJour = new Date(Date.UTC(annee, moisIndex0 + 1, 0));
  const debut = lundiDeLaSemaine(premierJour);
  const finSemaine = lundiDeLaSemaine(dernierJour);
  const fin = new Date(finSemaine.getTime() + 7 * JOUR_MS);
  return { debut, fin };
}

/** Décale une clé YYYY-MM de `delta` mois. */
export function decalerMoisKey(moisKey: string, delta: number): string {
  const [annee, mois] = moisKey.split('-').map(Number);
  const d = new Date(Date.UTC(annee, mois - 1 + delta, 1));
  return formatMoisKey(d);
}

/** Décale une clé YYYY-MM-DD (lundi de semaine) de `deltaSemaines` semaines. */
export function decalerSemaineKey(semaineKey: string, deltaSemaines: number): string {
  const [annee, mois, jour] = semaineKey.split('-').map(Number);
  const d = new Date(Date.UTC(annee, mois - 1, jour + deltaSemaines * 7));
  return formatDateKey(d);
}

/** Découpe une clé YYYY-MM en {annee, moisIndex0}. */
export function decomposerMoisKey(moisKey: string): { annee: number; moisIndex0: number } {
  const [annee, mois] = moisKey.split('-').map(Number);
  return { annee, moisIndex0: mois - 1 };
}
