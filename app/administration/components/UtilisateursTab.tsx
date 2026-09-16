'use client';

/**
 * Onglet Utilisateurs de l'écran Administration (section 17) : liste des
 * comptes applicatifs (getAllUtilisateurs), avec un filtre texte local (132
 * comptes) et un bouton de connexion SSO non fonctionnel (section 41,
 * simple aperçu visuel de la fonctionnalité à venir).
 */

import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { ModeAuthentification, RoleUtilisateur, StatutCompteUtilisateur, Utilisateur } from '@/domain/types';
import { formatDistanceToNow } from '@/lib/utils';
import { LIBELLE_MODE_AUTHENTIFICATION, LIBELLE_STATUT_COMPTE_UTILISATEUR } from '@/lib/derived/libelles-administration';

type Tone = { bg: string; text: string; border: string };

const TONE_STATUT_COMPTE: Record<StatutCompteUtilisateur, Tone> = {
  [StatutCompteUtilisateur.ACTIF]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  [StatutCompteUtilisateur.INACTIF]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  [StatutCompteUtilisateur.SUSPENDU]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  [StatutCompteUtilisateur.EN_ATTENTE_ACTIVATION]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

function StatutCompteBadge({ statut }: { statut: StatutCompteUtilisateur }) {
  const tone = TONE_STATUT_COMPTE[statut];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${tone.bg} ${tone.text} ${tone.border}`}>
      {LIBELLE_STATUT_COMPTE_UTILISATEUR[statut]}
    </span>
  );
}

interface UtilisateursTabProps {
  utilisateurs: Utilisateur[];
  roleLibelles: Record<RoleUtilisateur, string>;
}

export default function UtilisateursTab({ utilisateurs, roleLibelles }: UtilisateursTabProps) {
  const [recherche, setRecherche] = useState('');

  const utilisateursFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return utilisateurs;
    return utilisateurs.filter(
      (u) => u.nomComplet.toLowerCase().includes(terme) || u.email.toLowerCase().includes(terme)
    );
  }, [utilisateurs, recherche]);

  return (
    <div className="space-y-4">
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-sky-900">Connexion unique (SSO)</p>
          <p className="text-xs text-sky-700 mt-0.5">
            Authentification via l&apos;identité de l&apos;entreprise (Active Directory) — aperçu, non fonctionnel dans cette maquette.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Fonctionnalité non disponible dans cette maquette"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-sky-300 rounded-md text-sky-700 opacity-70 cursor-not-allowed shrink-0"
        >
          <Building2 className="h-4 w-4" />
          Se connecter avec l&apos;identité de l&apos;entreprise
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un nom ou un e-mail..."
          className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500">
          {utilisateursFiltres.length.toLocaleString('fr-FR')} compte{utilisateursFiltres.length > 1 ? 's' : ''}
          {utilisateursFiltres.length !== utilisateurs.length ? ` sur ${utilisateurs.length.toLocaleString('fr-FR')} au total` : ''}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Authentification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utilisateursFiltres.map((utilisateur) => (
                <tr key={utilisateur.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{utilisateur.nomComplet}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{utilisateur.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{roleLibelles[utilisateur.role]}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatutCompteBadge statut={utilisateur.statut} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {LIBELLE_MODE_AUTHENTIFICATION[utilisateur.modeAuthentification]}
                    {utilisateur.modeAuthentification === ModeAuthentification.SSO_ENTREPRISE && utilisateur.groupeActiveDirectory && (
                      <span className="block text-xs text-gray-400">{utilisateur.groupeActiveDirectory}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {utilisateur.derniereConnexion ? formatDistanceToNow(new Date(utilisateur.derniereConnexion)) : 'Jamais connecté'}
                  </td>
                </tr>
              ))}
              {utilisateursFiltres.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun utilisateur ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
