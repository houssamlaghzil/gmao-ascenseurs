/**
 * Point d'entrée /mobile : simple aiguillage selon la présence du cookie de
 * session technicien, sans passer par le repli par défaut de
 * getTechnicienConnecteId (qui masquerait justement l'absence de cookie).
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_TECHNICIEN } from '@/lib/mobile-session';

export default function MobileIndexPage() {
  const technicienId = cookies().get(COOKIE_TECHNICIEN)?.value;
  redirect(technicienId ? '/mobile/accueil' : '/mobile/connexion');
}
