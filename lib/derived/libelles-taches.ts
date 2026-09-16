/**
 * Libellés français pour les enums de l'écran Centre des tâches asynchrones
 * (section 16). StatutTacheAsynchrone a déjà son propre badge (voir
 * components/StatusBadges.tsx, StatutTacheAsynchroneBadge) — non repris ici.
 */

import { FormatFichierExport, TypeTacheAsynchrone, WorkerTraitement } from '@/domain/types';

export const LIBELLE_TYPE_TACHE_ASYNCHRONE: Record<TypeTacheAsynchrone, string> = {
  [TypeTacheAsynchrone.EXPORT_HISTORIQUE_CLIENT]: 'Export historique client',
  [TypeTacheAsynchrone.EXPORT_DONNEES_PARC]: 'Export données parc',
  [TypeTacheAsynchrone.GENERATION_RAPPORT_PERIODIQUE]: 'Génération de rapport périodique',
  [TypeTacheAsynchrone.GENERATION_PDF_UNITAIRE]: 'Génération de PDF unitaire',
  [TypeTacheAsynchrone.GENERATION_PDF_GROUPEE]: 'Génération de PDF groupée',
  [TypeTacheAsynchrone.SYNCHRONISATION_INTEGRATION]: "Synchronisation d'intégration",
  [TypeTacheAsynchrone.IMPORT_DONNEES]: 'Import de données',
};

/** Section 43 — purement informatif (nom du worker de traitement). */
export const LIBELLE_WORKER_TRAITEMENT: Record<WorkerTraitement, string> = {
  [WorkerTraitement.PDF]: 'Worker PDF',
  [WorkerTraitement.EXPORT]: 'Worker export',
  [WorkerTraitement.INTEGRATIONS]: 'Worker intégrations',
  [WorkerTraitement.NOTIFICATIONS]: 'Worker notifications',
  [WorkerTraitement.MEDIAS]: 'Worker médias',
  [WorkerTraitement.PLANIFICATION]: 'Worker planification',
  [WorkerTraitement.STATISTIQUES]: 'Worker statistiques',
};

export const LIBELLE_FORMAT_FICHIER_EXPORT: Record<FormatFichierExport, string> = {
  [FormatFichierExport.PDF]: 'PDF',
  [FormatFichierExport.CSV]: 'CSV',
  [FormatFichierExport.XLSX]: 'XLSX',
  [FormatFichierExport.ZIP]: 'ZIP',
};

/** Formate une taille en octets en unité lisible (Ko/Mo), sans dépendance externe. */
export function formatTailleOctets(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const ko = octets / 1024;
  if (ko < 1024) return `${ko.toFixed(0)} Ko`;
  const mo = ko / 1024;
  return `${mo.toFixed(1)} Mo`;
}
