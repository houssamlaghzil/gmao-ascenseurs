'use server';

/**
 * Server Action du Centre de synchronisation mobile (section 35).
 *
 * Rejoue un envoi pour un élément en ECHEC (`peutReessayer`) : ENVOI_EN_COURS
 * puis SYNCHRONISE, comme demandé par la section 35 — `nombreTentatives` est
 * incrémenté, `horodatageEvenement` (l'instant réel de l'action terrain)
 * n'est JAMAIS modifié, seuls le statut, la dernière tentative et le message
 * d'erreur évoluent. Pas de délai simulé : la démo n'a pas de véritable
 * aller-retour réseau à représenter.
 */

import { revalidatePath } from 'next/cache';
import { StatutSynchronisation } from '@/domain/types';
import { getElementFileSynchronisationById, updateElementFileSynchronisation } from '@/data/store';

export async function reessayerElementSync(formData: FormData): Promise<void> {
  const elementId = String(formData.get('elementId'));
  const element = getElementFileSynchronisationById(elementId);
  if (!element || !element.peutReessayer) return;

  const dateDerniereTentative = new Date().toISOString();
  updateElementFileSynchronisation({
    ...element,
    statut: StatutSynchronisation.ENVOI_EN_COURS,
    dateDerniereTentative,
    nombreTentatives: element.nombreTentatives + 1,
    messageErreur: undefined,
    peutReessayer: false,
  });

  const elementEnvoi = getElementFileSynchronisationById(elementId)!;
  updateElementFileSynchronisation({
    ...elementEnvoi,
    statut: StatutSynchronisation.SYNCHRONISE,
    dateSynchronisationReussie: new Date().toISOString(),
  });

  revalidatePath('/mobile/synchronisation');
  revalidatePath('/mobile/accueil');
}
