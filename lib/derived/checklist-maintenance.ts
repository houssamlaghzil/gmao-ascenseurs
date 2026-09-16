/**
 * Génère une checklist tactile de démarrage pour une maintenance mobile
 * (section 31.3), à partir des catégories sélectionnées par le technicien.
 *
 * Distinct de la génération interne (non exportée) de data/mockData.ts :
 * là-bas, `checklist` n'est peuplée que sur une minorité de maintenances
 * déjà REALISEE (15 % pour la démo, coché aléatoirement) — les maintenances
 * ouvertes (PLANIFIEE / EN_COURS_DE_REALISATION), seules cibles du parcours
 * mobile, n'ont donc jamais de checklist préexistante. Chaque passage
 * démarre ainsi sur une checklist fraîche, entièrement décochée, que le
 * technicien complète sur site.
 */

import { CategorieMaintenance, ChecklistItemMaintenance } from '@/domain/types';

const LIBELLES_PAR_CATEGORIE: Partial<Record<CategorieMaintenance, string[]>> = {
  [CategorieMaintenance.PERIODIQUE]: ['Contrôle général', 'Graissage'],
  [CategorieMaintenance.CABLE]: ['Contrôle visuel des câbles', 'Mesure de tension'],
  [CategorieMaintenance.PARACHUTE]: ['Test de déclenchement', 'Contrôle du limiteur de vitesse'],
  [CategorieMaintenance.NETTOYAGE]: ['Nettoyage cabine', 'Nettoyage gaine'],
  [CategorieMaintenance.AUTRE]: ['Contrôle spécifique'],
};

/** Checklist fraîche (tout décoché) pour les catégories choisies au démarrage de la visite. */
export function genererChecklistMaintenance(categories: CategorieMaintenance[]): ChecklistItemMaintenance[] {
  const items: ChecklistItemMaintenance[] = [];
  categories.forEach((categorie) => {
    const libelles = LIBELLES_PAR_CATEGORIE[categorie] ?? ['Contrôle spécifique'];
    libelles.forEach((libelle, idx) => {
      items.push({ id: `chk-${categorie}-${idx}`, categorie, libelle, coche: false, obligatoire: idx === 0 });
    });
  });
  return items;
}
