/**
 * Construction de l'aperçu PDF client d'un rapport (section 9.3) : remplit
 * le type RapportPdfApercu déjà défini par le domaine (contraste élevé,
 * grandes photos, chronologie claire), calculé à la demande à partir du
 * Rapport et jamais stocké.
 */

import { CategoriePhoto, EtapeChronologiePdf, PhotoRapport, Rapport, RapportPdfApercu } from '@/domain/types';
import { getAscenseurById, getClientById, getPhotosByRapportId } from '@/data/store';

/** Ordre de priorité pour choisir "une photo importante par section" (section 9.3). */
const ORDRE_PRIORITE_PHOTO: CategoriePhoto[] = [
  CategoriePhoto.AVANT_INTERVENTION,
  CategoriePhoto.APRES_INTERVENTION,
  CategoriePhoto.PIECE_CASSEE,
  CategoriePhoto.RESERVE_CTQ,
  CategoriePhoto.ETAT_GENERAL,
  CategoriePhoto.SIGNALETIQUE,
  CategoriePhoto.AUTRE,
];

function construireChronologie(rapport: Rapport): EtapeChronologiePdf[] {
  if (!rapport.accesObtenu && rapport.refusAcces) {
    return [
      { libelle: 'Déplacement sur site', dateHeure: rapport.dateHeureDebut },
      { libelle: 'Accès non obtenu', dateHeure: rapport.refusAcces.heureConstat },
    ];
  }

  const etapes: EtapeChronologiePdf[] = [{ libelle: 'Arrivée sur site', dateHeure: rapport.dateHeureDebut }];
  if (rapport.diagnostic) {
    etapes.push({ libelle: 'Diagnostic posé', dateHeure: rapport.dateHeureDebut });
  }
  if (rapport.dateHeureFin) {
    etapes.push({ libelle: 'Clôture de la visite', dateHeure: rapport.dateHeureFin });
  }
  if (rapport.signatureClient?.dateHeure) {
    etapes.push({ libelle: 'Signature client', dateHeure: rapport.signatureClient.dateHeure });
  }
  return etapes;
}

/** Une photo au plus par catégorie, dans l'ordre de priorité défini ci-dessus. */
function choisirPhotosMisesEnAvant(photos: PhotoRapport[]): PhotoRapport[] {
  const premierePhotoParCategorie = new Map<CategoriePhoto, PhotoRapport>();
  for (const photo of photos) {
    if (!premierePhotoParCategorie.has(photo.categorie)) premierePhotoParCategorie.set(photo.categorie, photo);
  }
  return ORDRE_PRIORITE_PHOTO.map((categorie) => premierePhotoParCategorie.get(categorie)).filter(
    (photo): photo is PhotoRapport => Boolean(photo)
  );
}

export function construireApercuPdfRapport(rapport: Rapport): RapportPdfApercu {
  const ascenseur = getAscenseurById(rapport.ascenseurId);
  const client = ascenseur ? getClientById(ascenseur.clientId) : undefined;

  return {
    rapport,
    appareilCode: ascenseur?.code ?? rapport.ascenseurId,
    clientNom: client?.raisonSociale ?? '—',
    chronologie: construireChronologie(rapport),
    photosMisesEnAvant: choisirPhotosMisesEnAvant(getPhotosByRapportId(rapport.id)),
  };
}
