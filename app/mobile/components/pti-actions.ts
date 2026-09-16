'use server';

/**
 * Server Actions du widget PTI/DATI (section 38) — transitions volontairement
 * simples (un setter d'état + horodatage), indépendantes de toute file de
 * synchronisation GMAO : la sécurité du technicien ne doit jamais dépendre
 * d'un mode hors ligne ou d'un échec d'envoi (voir domain/types.ts,
 * commentaire sur EtatProtectionPTI).
 *
 * `definirEtatPTI` est appelée à la fois par les formulaires du widget (via
 * le wrapper FormData `changerEtatPTIForm`) et directement par le composant
 * client de compte à rebours (CompteARebourgPTI), une fois celui-ci écoulé.
 */

import { revalidatePath } from 'next/cache';
import { EtatProtectionPTI, EtatPTITechnicien } from '@/domain/types';
import { getEtatPTIByTechnicienId, updateEtatPTITechnicien } from '@/data/store';

const DUREE_INHIBITION_PAR_DEFAUT_SECONDES = 300;

function revaliderEcransPTI(): void {
  // Le widget est affiché sur les deux écrans mobiles qui l'importent
  // (section 38) : les deux doivent voir l'état à jour à la prochaine visite.
  revalidatePath('/mobile/accueil');
  revalidatePath('/mobile/synchronisation');
}

export async function definirEtatPTI(technicienId: string, cible: EtatProtectionPTI): Promise<void> {
  const etatActuel = getEtatPTIByTechnicienId(technicienId);
  if (!etatActuel) return;

  const dureeInhibitionSecondes = etatActuel.dureeInhibitionSecondes ?? DUREE_INHIBITION_PAR_DEFAUT_SECONDES;
  const enReactivation = cible === EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS;

  const nouvelEtat: EtatPTITechnicien = {
    ...etatActuel,
    etat: cible,
    dateDernierChangementEtat: new Date().toISOString(),
    finCompteARebours: enReactivation ? new Date(Date.now() + dureeInhibitionSecondes * 1000).toISOString() : undefined,
    dureeInhibitionSecondes: enReactivation ? dureeInhibitionSecondes : etatActuel.dureeInhibitionSecondes,
  };
  updateEtatPTITechnicien(nouvelEtat);
  revaliderEcransPTI();
}

/** Wrapper FormData pour les boutons rendus depuis un Server Component (voir WidgetPTI.tsx). */
export async function changerEtatPTIForm(formData: FormData): Promise<void> {
  const technicienId = String(formData.get('technicienId'));
  const cibleBrute = formData.get('cibleEtat');
  const cible =
    typeof cibleBrute === 'string' && (Object.values(EtatProtectionPTI) as string[]).includes(cibleBrute)
      ? (cibleBrute as EtatProtectionPTI)
      : undefined;
  if (!cible) return;
  await definirEtatPTI(technicienId, cible);
}
