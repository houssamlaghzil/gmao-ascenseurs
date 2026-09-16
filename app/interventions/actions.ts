'use server';

/**
 * Server Actions de l'écran Détail intervention (section 8) : réattribution
 * (bouton "Réattribuer"). Appelle domain/business-logic.reaffecter puis
 * data/store.updateIntervention + addReaffectation, sans muter les entités
 * gelées directement.
 */

import { revalidatePath } from 'next/cache';
import { MotifReattribution, OrigineAction } from '@/domain/types';
import { reaffecter } from '@/domain/business-logic';
import { addReaffectation, getInterventionById, getTechnicienById, updateIntervention } from '@/data/store';

export interface ReattributionResult {
  success: boolean;
  error?: string;
}

/**
 * Réattribue une intervention à un autre technicien. La maquette n'ayant pas
 * d'authentification, le demandeur est affiché comme "Dispatcher (Web)" —
 * cohérent avec l'auteur "Système Manei-Lift" déjà utilisé pour les actions
 * automatiques du jeu de données (voir data/mockData.ts).
 */
export async function reaffecterInterventionAction(
  interventionId: string,
  nouveauTechnicienId: string,
  motif: MotifReattribution,
  commentaire: string
): Promise<ReattributionResult> {
  const intervention = getInterventionById(interventionId);
  if (!intervention) {
    return { success: false, error: 'Intervention introuvable.' };
  }
  if (!nouveauTechnicienId) {
    return { success: false, error: 'Sélectionnez un technicien.' };
  }
  const technicien = getTechnicienById(nouveauTechnicienId);
  if (!technicien) {
    return { success: false, error: 'Technicien introuvable.' };
  }

  try {
    const { intervention: interventionMaj, reaffectation } = reaffecter(
      intervention,
      nouveauTechnicienId,
      motif,
      OrigineAction.WEB,
      commentaire.trim() || undefined,
      'Dispatcher (Web)'
    );

    updateIntervention(interventionMaj);
    addReaffectation(reaffectation);

    revalidatePath(`/interventions/${interventionId}`);
    revalidatePath('/interventions');

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue lors de la réattribution.' };
  }
}
