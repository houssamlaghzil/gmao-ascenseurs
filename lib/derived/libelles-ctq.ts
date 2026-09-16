/**
 * Libellés français pour les enums des écrans CTQ / Réserves (section 10).
 *
 * IMPORTANT : dans data/mockData.ts, `BlocControle.libelle` et
 * `ReserveCTQ.libelleBloc` sont peuplés avec la valeur brute de l'enum
 * CategorieBlocControle (ex. "portes_palieres"), pas un texte français — ce
 * map est donc la seule source de libellé présentable pour un bloc. Les
 * libellés de PointDeControle (`libelle`) et de ReserveCTQ (`actionDemandee`,
 * `description`) sont eux déjà rédigés en français dans les données.
 */

import { CategorieBlocControle, TypeTraitementReserve } from '@/domain/types';

export const LIBELLE_CATEGORIE_BLOC_CONTROLE: Record<CategorieBlocControle, string> = {
  [CategorieBlocControle.MACHINERIE]: 'Machinerie',
  [CategorieBlocControle.CABINE]: 'Cabine',
  [CategorieBlocControle.PORTES_PALIERES]: 'Portes palières',
  [CategorieBlocControle.GAINE_CUVETTE]: 'Gaine et cuvette',
  [CategorieBlocControle.DISPOSITIFS_SECURITE]: 'Dispositifs de sécurité',
  [CategorieBlocControle.TELEALARME]: 'Téléalarme',
  [CategorieBlocControle.ACCESSIBILITE]: 'Accessibilité',
  [CategorieBlocControle.DOCUMENTATION]: 'Documentation',
  [CategorieBlocControle.AUTRE]: 'Autre',
};

/** Libellé d'un bloc à partir de son `libelleBloc` brut (ReserveCTQ) — retombe sur la valeur brute si elle ne correspond à aucune catégorie connue. */
export function libelleBlocReserve(libelleBlocBrut: string): string {
  return LIBELLE_CATEGORIE_BLOC_CONTROLE[libelleBlocBrut as CategorieBlocControle] ?? libelleBlocBrut;
}

export const LIBELLE_TYPE_TRAITEMENT_RESERVE: Record<TypeTraitementReserve, string> = {
  [TypeTraitementReserve.INTERVENTION]: 'Intervention',
  [TypeTraitementReserve.MAINTENANCE]: 'Maintenance',
};
