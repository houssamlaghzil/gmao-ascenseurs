'use server';

/**
 * Server Actions de l'écran Planning (section 11) : réaffectation par
 * glisser-déposer (section 11.2). Pour une intervention, appelle
 * domain/business-logic.reaffecter (comme app/interventions/actions.ts) ;
 * une maintenance n'a pas de fonction business-logic dédiée, la
 * réaffectation se limite donc à créer une Reaffectation (cibleType
 * MAINTENANCE) et à mettre à jour Maintenance.technicienId directement via
 * data/store.updateMaintenance, sans muter l'objet reçu du store.
 */

import { revalidatePath } from 'next/cache';
import { MotifReattribution, OrigineAction, Reaffectation, TypeCiblePlanning, TypeTachePlanning } from '@/domain/types';
import { reaffecter } from '@/domain/business-logic';
import {
  addReaffectation,
  getInterventionById,
  getMaintenanceById,
  getTechnicienById,
  updateIntervention,
  updateMaintenance,
} from '@/data/store';

export interface ReaffectationPlanningResult {
  success: boolean;
  error?: string;
}

/** Génère un ID unique simple pour la démo (même forme que domain/business-logic.ts, non exportée de ce fichier gelé). */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const COMMENTAIRE_DRAG_AND_DROP = 'Réaffectée depuis le planning (glisser-déposer)';
const DEMANDEUR_PLANIFICATEUR = 'Planificateur (Web)';

/**
 * Réaffecte une tâche du planning (maintenance ou intervention) à un autre
 * technicien. Une absence ne peut pas être réaffectée par ce biais : elle
 * n'est pas une charge de travail déplaçable, voir section 11.3.
 */
export async function reaffecterTachePlanningAction(
  typeTache: TypeTachePlanning,
  referenceId: string,
  nouveauTechnicienId: string
): Promise<ReaffectationPlanningResult> {
  if (typeTache === TypeTachePlanning.ABSENCE) {
    return { success: false, error: 'Une absence ne peut pas être réaffectée depuis le planning.' };
  }
  if (!nouveauTechnicienId) {
    return { success: false, error: 'Sélectionnez un technicien de destination.' };
  }
  const nouveauTechnicien = getTechnicienById(nouveauTechnicienId);
  if (!nouveauTechnicien) {
    return { success: false, error: 'Technicien de destination introuvable.' };
  }

  try {
    if (typeTache === TypeTachePlanning.INTERVENTION) {
      const intervention = getInterventionById(referenceId);
      if (!intervention) return { success: false, error: 'Intervention introuvable.' };
      if (intervention.technicienId === nouveauTechnicienId) return { success: true };

      const { intervention: interventionMaj, reaffectation } = reaffecter(
        intervention,
        nouveauTechnicienId,
        MotifReattribution.AUTRE,
        OrigineAction.WEB,
        COMMENTAIRE_DRAG_AND_DROP,
        DEMANDEUR_PLANIFICATEUR
      );
      updateIntervention(interventionMaj);
      addReaffectation(reaffectation);

      revalidatePath('/planning');
      revalidatePath('/techniciens');
      revalidatePath(`/interventions/${intervention.id}`);
      return { success: true };
    }

    // MAINTENANCE — pas de fonction business-logic dédiée : mise à jour directe.
    const maintenance = getMaintenanceById(referenceId);
    if (!maintenance) return { success: false, error: 'Maintenance introuvable.' };
    if (maintenance.technicienId === nouveauTechnicienId) return { success: true };

    const reaffectation: Reaffectation = {
      id: generateId(),
      cibleType: TypeCiblePlanning.MAINTENANCE,
      cibleId: maintenance.id,
      ancienTechnicienId: maintenance.technicienId,
      nouveauTechnicienId,
      motif: MotifReattribution.AUTRE,
      commentaire: COMMENTAIRE_DRAG_AND_DROP,
      dateHeure: new Date().toISOString(),
      origine: OrigineAction.WEB,
      demandeurNom: DEMANDEUR_PLANIFICATEUR,
    };
    addReaffectation(reaffectation);
    updateMaintenance({ ...maintenance, technicienId: nouveauTechnicienId });

    revalidatePath('/planning');
    revalidatePath('/techniciens');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue lors de la réaffectation.' };
  }
}
