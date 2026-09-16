import { cookies } from 'next/headers';
import { getTechnicienById, getAllTechniciens } from '@/data/store';
import type { Technicien } from '@/domain/types';

/** Nom du cookie posé par app/mobile/connexion (section 18) pour simuler une session technicien. */
export const COOKIE_TECHNICIEN = 'technicienId';

/** Technicien "de démonstration" ouvert par défaut (scénario canonique du Centre de synchronisation, section 35). */
export const TECHNICIEN_PAR_DEFAUT = 'tech-001';

/** Id du technicien actuellement "connecté" sur le mobile (cookie, sinon technicien par défaut). */
export function getTechnicienConnecteId(): string {
  const id = cookies().get(COOKIE_TECHNICIEN)?.value;
  if (id && getTechnicienById(id)) return id;
  return TECHNICIEN_PAR_DEFAUT;
}

/** Technicien actuellement "connecté" (objet complet). */
export function getTechnicienConnecte(): Technicien {
  return getTechnicienById(getTechnicienConnecteId()) ?? getAllTechniciens()[0];
}
