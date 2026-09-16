'use server';

/**
 * Validation d'une maintenance mobile (section 31) — appelée une seule fois,
 * à la fin de l'assistant (MaintenanceWizard). Pas de fonction dédiée dans
 * domain/business-logic.ts (gelé, aucune transition de Maintenance n'y est
 * définie) : la mise à jour se fait directement via data/store.ts, comme
 * demandé par la mission ("Valide en mettant à jour la Maintenance via
 * updateMaintenance").
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CategorieMaintenance, ChecklistItemMaintenance, OrigineAction, ResultatTestTelealarme, StatutMaintenance } from '@/domain/types';
import { getMaintenanceById, updateMaintenance } from '@/data/store';

export interface SaisieMaintenance {
  categories: CategorieMaintenance[];
  checklist: ChecklistItemMaintenance[];
  testTelealarmeResultat: ResultatTestTelealarme;
  /** Minutes de présence effectivement écoulées, mesurées côté client depuis le début de la visite. */
  dureeReelleMinutes: number;
}

export async function validerMaintenance(maintenanceId: string, saisie: SaisieMaintenance): Promise<void> {
  const maintenance = getMaintenanceById(maintenanceId);
  if (!maintenance) throw new Error('Maintenance introuvable');

  const heureFin = new Date().toISOString();
  // heureDebut peut déjà être posée (visite déjà en cours) ; sinon on la
  // déduit de la durée mesurée côté client pour rester cohérent avec heureFin.
  const heureDebut = maintenance.heureDebut ?? new Date(Date.now() - saisie.dureeReelleMinutes * 60_000).toISOString();
  const avertissementDureeInsuffisante = saisie.dureeReelleMinutes < maintenance.seuilDureeMinimaleMinutes;

  updateMaintenance({
    ...maintenance,
    categories: saisie.categories,
    statut: StatutMaintenance.REALISEE,
    dateRealisee: heureFin,
    heureArrivee: maintenance.heureArrivee ?? heureDebut,
    heureDebut,
    heureFin,
    dureeReelleMinutes: saisie.dureeReelleMinutes,
    avertissementDureeInsuffisante,
    testTelealarmeEffectue: true,
    testTelealarmeResultat: saisie.testTelealarmeResultat,
    checklist: saisie.checklist,
    origineDerniereModification: OrigineAction.MOBILE,
  });

  revalidatePath('/mobile/maintenances');
  revalidatePath(`/mobile/maintenances/${maintenanceId}`);
  revalidatePath('/mobile/accueil');
  redirect('/mobile/maintenances');
}
