/**
 * Libellés d'affichage du mode dégradé (section 5) : les étages concernés
 * sont stockés comme des codes (ex. "RDC", "1") référençant
 * Ascenseur.ficheTechnique.niveauxDesservis — jamais affichés bruts.
 */

import { Ascenseur } from '@/domain/types';

export function libelleNiveau(ascenseur: Ascenseur, code: string): string {
  const niveau = ascenseur.ficheTechnique.niveauxDesservis.find((n) => n.code === code);
  return niveau ? niveau.libelle : code;
}

/** Ex. "RDC, 1er étage" — chaîne vide si l'appareil n'est pas en mode dégradé. */
export function libellesEtagesConcernes(ascenseur: Ascenseur): string {
  if (!ascenseur.modeDegrade) return '';
  return ascenseur.modeDegrade.etagesConcernes.map((code) => libelleNiveau(ascenseur, code)).join(', ');
}
