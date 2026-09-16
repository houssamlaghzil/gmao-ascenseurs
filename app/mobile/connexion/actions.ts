'use server';

/**
 * Server Action du formulaire de connexion mobile (section 18). Il n'y a
 * aucune vraie authentification dans cette simulation : les champs
 * identifiant/mot de passe du formulaire sont décoratifs (non vérifiés,
 * non transmis ici). Se "connecter" consiste simplement à poser le cookie
 * technicienId choisi dans le sélecteur "Technicien de démonstration" et à
 * rediriger vers l'accueil (section 19).
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTechnicienById } from '@/data/store';
import { COOKIE_TECHNICIEN, TECHNICIEN_PAR_DEFAUT } from '@/lib/mobile-session';

export async function seConnecter(formData: FormData): Promise<void> {
  const saisi = formData.get('technicienId');
  const technicienId = typeof saisi === 'string' && getTechnicienById(saisi) ? saisi : TECHNICIEN_PAR_DEFAUT;

  cookies().set(COOKIE_TECHNICIEN, technicienId, { path: '/' });
  redirect('/mobile/accueil');
}
