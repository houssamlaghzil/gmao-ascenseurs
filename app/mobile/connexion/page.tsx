/**
 * Écran de connexion mobile (section 18). Simulation volontairement
 * minimale : pas de vraie authentification, les champs identifiant/mot de
 * passe existent pour la forme mais ne sont ni vérifiés ni requis. Le
 * sélecteur "Technicien de démonstration" met en avant les 6 scénarios
 * curés (tech-001 à tech-006, voir data/mockData.ts) pour rejouer les
 * démonstrations (hors ligne, synchronisation en cours, PTI, etc.).
 *
 * Pas de BandeauConnexion ici : tant que le technicien n'a pas choisi qui
 * il est, il n'y a pas encore de session dont afficher l'état de connexion.
 */

import { LogIn, Lock, User } from 'lucide-react';
import { getAllTechniciens } from '@/data/store';
import { TECHNICIEN_PAR_DEFAUT } from '@/lib/mobile-session';
import { seConnecter } from './actions';

const SCENARIOS_CURES: { id: string; libelle: string }[] = [
  { id: 'tech-001', libelle: 'scénario par défaut' },
  { id: 'tech-002', libelle: 'hors ligne' },
  { id: 'tech-003', libelle: 'synchronisation en cours' },
  { id: 'tech-004', libelle: 'PTI réactivation en compte à rebours' },
  { id: 'tech-005', libelle: 'PTI intégration tierce' },
  { id: 'tech-006', libelle: 'réaffectation née hors ligne' },
];

export default function ConnexionMobilePage() {
  const techniciensActifs = getAllTechniciens().filter((t) => t.actif);
  const nomParId = new Map(techniciensActifs.map((t) => [t.id, t.nomComplet]));
  const idsScenarios = new Set(SCENARIOS_CURES.map((s) => s.id));
  const autresTechniciens = techniciensActifs
    .filter((t) => !idsScenarios.has(t.id))
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));

  return (
    <div className="flex flex-col bg-gray-50 px-5 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
          <LogIn className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-base font-semibold text-gray-900">Manei-Lift</h1>
        <p className="text-xs text-gray-500">Espace technicien</p>
      </div>

      <form action={seConnecter} className="flex flex-col gap-4">
        <div>
          <label htmlFor="identifiant" className="mb-1 block text-xs font-medium text-gray-600">
            Identifiant
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="identifiant"
              name="identifiant"
              type="text"
              autoComplete="username"
              placeholder="ex. florian.leroy"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="motDePasse" className="mb-1 block text-xs font-medium text-gray-600">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label htmlFor="technicienId" className="mb-1 block text-xs font-medium text-gray-600">
            Technicien de démonstration
          </label>
          <select
            id="technicienId"
            name="technicienId"
            defaultValue={TECHNICIEN_PAR_DEFAUT}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <optgroup label="Scénarios de démonstration">
              {SCENARIOS_CURES.map((s) => (
                <option key={s.id} value={s.id}>
                  {nomParId.get(s.id) ?? s.id} — {s.libelle}
                </option>
              ))}
            </optgroup>
            {autresTechniciens.length > 0 && (
              <optgroup label="Autres techniciens">
                {autresTechniciens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nomComplet}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
            Aucune authentification réelle : ce choix simule le technicien connecté sur le mobile.
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white active:bg-indigo-700"
        >
          Connexion
        </button>
      </form>
    </div>
  );
}
