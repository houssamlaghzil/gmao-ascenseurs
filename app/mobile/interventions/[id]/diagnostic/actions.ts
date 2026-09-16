'use server';

/**
 * Validation du diagnostic progressif (section 26). Le diagnostic n'a pas
 * d'existence propre en base : il est porté par Rapport.diagnostic (voir
 * domain/types.ts). Comme la clôture (section 27, écran /cloture construit
 * par un autre agent) n'a pas encore eu lieu à ce stade, le diagnostic est
 * enregistré dans un Rapport BROUILLON — StatutSynchronisation.BROUILLON
 * existe précisément pour couvrir "la saisie non finalisée" — que l'écran de
 * clôture complètera (photos, signatures, état de clôture) avant de le faire
 * passer à EN_ATTENTE. S'il existe déjà un brouillon pour cette intervention
 * (retour en arrière puis re-validation du diagnostic), il est mis à jour
 * plutôt que dupliqué.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  DiagnosticProgressif,
  LocalDiagnostic,
  OrigineAction,
  OrigineDiagnostic,
  RattachementRapport,
  StatutSynchronisation,
  StatutValidationRapport,
  TypeRapport,
} from '@/domain/types';
import {
  addRapport,
  getActionsDiagnosticReferentiel,
  getAscenseurById,
  getEquipementsReferentiel,
  getEtatsEquipementReferentiel,
  getInterventionById,
  getRapportsByInterventionId,
  updateRapport,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';

export interface DiagnosticSaisi {
  origine: OrigineDiagnostic;
  etage?: string;
  local?: LocalDiagnostic;
  equipementId?: string;
  etatConstateId?: string;
  actionId?: string;
  commentaireDiagnostic?: string;
}

/** Génère un ID unique simple pour la démo (non exportée de data/store.ts, gelé). */
function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function validerDiagnostic(interventionId: string, saisie: DiagnosticSaisi): Promise<void> {
  const intervention = getInterventionById(interventionId);
  if (!intervention) throw new Error('Intervention introuvable');
  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const technicien = getTechnicienConnecte();

  const equipement = saisie.equipementId ? getEquipementsReferentiel().find((e) => e.id === saisie.equipementId) : undefined;
  const etat = saisie.etatConstateId ? getEtatsEquipementReferentiel().find((e) => e.id === saisie.etatConstateId) : undefined;
  const action = saisie.actionId ? getActionsDiagnosticReferentiel().find((a) => a.id === saisie.actionId) : undefined;

  const diagnostic: DiagnosticProgressif = {
    origine: saisie.origine,
    etage: saisie.etage,
    local: saisie.local,
    equipementId: equipement?.id,
    equipementLibelle: equipement?.libelle,
    etatConstateId: etat?.id,
    etatConstateLibelle: etat?.libelle,
    actionId: action?.id,
    actionLibelle: action?.libelle,
    commentaireDiagnostic: saisie.commentaireDiagnostic?.trim() || undefined,
  };

  const rapportsExistants = getRapportsByInterventionId(interventionId);
  const brouillon = rapportsExistants.find((r) => r.statutSynchronisation === StatutSynchronisation.BROUILLON);

  if (brouillon) {
    updateRapport({ ...brouillon, diagnostic });
  } else {
    const rapportId = genererId('rap-mob');
    addRapport({
      id: rapportId,
      numero: `RAP-${new Date().getFullYear()}-${rapportId.slice(-6)}`,
      rattachement: RattachementRapport.INTERVENTION,
      interventionId,
      numeroPassageIntervention: rapportsExistants.length + 1,
      typeRapport: TypeRapport.DEPANNAGE,
      ascenseurId: intervention.ascenseurId,
      adresseAppareil: ascenseur?.adresseComplete ?? '',
      technicienId: technicien.id,
      technicienNom: technicien.nomComplet,
      dateHeureDebut: intervention.dateArriveeSite ?? new Date().toISOString(),
      accesObtenu: true,
      etatInitial: intervention.etatAppareilInitial,
      diagnostic,
      photoIds: [],
      origineSaisie: OrigineAction.MOBILE,
      statutSynchronisation: StatutSynchronisation.BROUILLON,
      statutValidation: StatutValidationRapport.EN_ATTENTE,
    });
  }

  revalidatePath(`/mobile/interventions/${interventionId}/diagnostic`);
  redirect(`/mobile/interventions/${interventionId}/cloture`);
}
