'use server';

/**
 * Server Action "Début / Fin de journée" de l'écran d'accueil (section 37).
 *
 * data/store.ts ne conserve qu'une SessionTechnicien par technicien
 * (getSessionActiveDuTechnicien renvoie la première trouvée pour ce
 * technicienId, sans filtrer sur le statut — il n'y en a qu'une par
 * construction dans les données de démo). Pour rester cohérent avec cette
 * forme de données et permettre de rejouer le cycle début/fin plusieurs
 * fois en démo, on rouvre/referme la session existante du technicien
 * plutôt que d'en empiler une nouvelle à chaque "Début de journée" (ce qui
 * laisserait getSessionActiveDuTechnicien continuer à renvoyer l'ancienne
 * session, toujours en tête de liste). addSessionTechnicien n'est utilisé
 * que dans le cas — inexistant dans les données actuelles mais possible en
 * théorie — où le technicien n'a encore aucune session.
 */

import { revalidatePath } from 'next/cache';
import { EtatConnexionMobile, SessionTechnicien, StatutSessionTechnicien } from '@/domain/types';
import {
  addSessionTechnicien,
  getSessionActiveDuTechnicien,
  getTourneesByTechnicienId,
  updateSessionTechnicien,
} from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';

/** Génère un ID unique simple pour la démo (même forme que app/planning/actions.ts, non exportée de data/store.ts, gelé). */
function generateId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function basculerJourneeTechnicien(): Promise<void> {
  const technicienId = getTechnicienConnecteId();
  const session = getSessionActiveDuTechnicien(technicienId);
  const tourneeDuJour = getTourneesByTechnicienId(technicienId)[0];

  if (!session) {
    const nouvelleSession: SessionTechnicien = {
      id: generateId(),
      technicienId,
      dateDebut: new Date().toISOString(),
      statut: StatutSessionTechnicien.EN_COURS,
      tourneeId: tourneeDuJour?.id,
      etatConnexion: EtatConnexionMobile.EN_LIGNE,
    };
    addSessionTechnicien(nouvelleSession);
  } else if (session.statut === StatutSessionTechnicien.EN_COURS) {
    updateSessionTechnicien({ ...session, statut: StatutSessionTechnicien.TERMINEE, dateFin: new Date().toISOString() });
  } else {
    updateSessionTechnicien({
      ...session,
      statut: StatutSessionTechnicien.EN_COURS,
      dateDebut: new Date().toISOString(),
      dateFin: undefined,
      tourneeId: tourneeDuJour?.id ?? session.tourneeId,
    });
  }

  revalidatePath('/mobile/accueil');
}
