'use server';

/**
 * Server Action de la fiche appareil mobile (section 23 — modification de
 * fiche technique) : digicode et gestion des clés. Chaque champ réellement
 * modifié produit sa propre EntreeJournalModification (origine MOBILE,
 * statutSynchronisation EN_ATTENTE — simule l'attente d'envoi vers la file
 * de synchronisation, section 35, avant tout aller-retour serveur réel),
 * puis l'Ascenseur est mis à jour via data/store.updateAscenseur. Aucune
 * fonction domain/business-logic.ts dédiée n'existe pour ce cas précis
 * (seul changerStatutAppareil y est défini) : mise à jour directe, comme
 * app/planning/actions.ts le fait déjà pour la réaffectation d'une
 * Maintenance.
 */

import { revalidatePath } from 'next/cache';
import { AuteurModification, ChampModifiable, DetenteurCles, OrigineAction, StatutSynchronisation, TypeAuteurModification } from '@/domain/types';
import { addEntreeJournalModification, getAscenseurById, updateAscenseur } from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import { LIBELLE_DETENTEUR_CLES } from '@/lib/derived/libelles-parc';

export interface ModificationFicheTechniqueInput {
  /** Nouveau digicode — absent si ce champ n'a pas été modifié. */
  digicode?: string;
  /** Nouveau détenteur des clés — absent si ce champ n'a pas été modifié. */
  detenteurCles?: DetenteurCles;
  /** Nouvelle localisation des clés — absent si ce champ n'a pas été modifié. */
  localisationCles?: string;
}

export interface ModificationFicheTechniqueResult {
  success: boolean;
  error?: string;
}

/** Génère un ID unique simple pour la démo (même forme que domain/business-logic.ts, non exportée de ce fichier gelé). */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function modifierFicheTechniqueAction(
  ascenseurId: string,
  modification: ModificationFicheTechniqueInput
): Promise<ModificationFicheTechniqueResult> {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) {
    return { success: false, error: 'Appareil introuvable.' };
  }
  if (modification.digicode === undefined && modification.detenteurCles === undefined && modification.localisationCles === undefined) {
    return { success: false, error: 'Aucune modification à enregistrer.' };
  }

  const technicien = getTechnicienConnecte();
  const auteur: AuteurModification = { type: TypeAuteurModification.TECHNICIEN, id: technicien.id, nomAffiche: technicien.nomComplet };
  const dateModification = new Date().toISOString();

  let ficheTechnique = { ...ascenseur.ficheTechnique };

  if (modification.digicode !== undefined) {
    addEntreeJournalModification({
      id: generateId(),
      ascenseurId,
      champModifie: ChampModifiable.DIGICODE,
      libelleChamp: 'Digicode',
      ancienneValeur: ascenseur.ficheTechnique.digicode ?? '',
      nouvelleValeur: modification.digicode,
      auteur,
      dateModification,
      origine: OrigineAction.MOBILE,
      statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    });
    ficheTechnique = { ...ficheTechnique, digicode: modification.digicode };
  }

  if (modification.detenteurCles !== undefined || modification.localisationCles !== undefined) {
    const detenteurAvant = ascenseur.ficheTechnique.gestionCles.detenteur;
    const localisationAvant = ascenseur.ficheTechnique.gestionCles.localisation ?? '';
    const detenteurApres = modification.detenteurCles ?? detenteurAvant;
    const localisationApres = modification.localisationCles ?? localisationAvant;

    const libelleAvant = `${LIBELLE_DETENTEUR_CLES[detenteurAvant]}${localisationAvant ? ' — ' + localisationAvant : ''}`;
    const libelleApres = `${LIBELLE_DETENTEUR_CLES[detenteurApres]}${localisationApres ? ' — ' + localisationApres : ''}`;

    addEntreeJournalModification({
      id: generateId(),
      ascenseurId,
      champModifie: ChampModifiable.GESTION_CLES,
      libelleChamp: 'Gestion des clés',
      ancienneValeur: libelleAvant,
      nouvelleValeur: libelleApres,
      auteur,
      dateModification,
      origine: OrigineAction.MOBILE,
      statutSynchronisation: StatutSynchronisation.EN_ATTENTE,
    });

    ficheTechnique = {
      ...ficheTechnique,
      gestionCles: { ...ficheTechnique.gestionCles, detenteur: detenteurApres, localisation: localisationApres || undefined },
    };
  }

  updateAscenseur({ ...ascenseur, ficheTechnique });

  revalidatePath(`/mobile/appareils/${ascenseurId}`);

  return { success: true };
}
