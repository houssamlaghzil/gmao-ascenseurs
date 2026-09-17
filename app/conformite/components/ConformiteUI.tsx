/**
 * Briques d'affichage partagées par les deux écrans de conformité
 * contractuelle (vue parc/contrats et détail d'un contrat).
 *
 * Server Components : aucun état, aucun handler. Rendu volontairement dense
 * et sobre — ces écrans se lisent d'un coup d'œil en réunion, la couleur y
 * est réservée à une seule information : le déficit.
 */

import { CategorieMaintenance } from '@/domain/types';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import {
  Compteurs,
  CompteursCategorie,
  tauxConformitePourcent,
} from '@/lib/derived/conformite-contractuelle';

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

export function nombre(valeur: number): string {
  return valeur.toLocaleString('fr-FR');
}

export function pourcent(valeur: number): string {
  return `${valeur} %`;
}

// ---------------------------------------------------------------------------
// Gravité
// ---------------------------------------------------------------------------

export type NiveauConformite = 'conforme' | 'attention' | 'critique';

/**
 * Trois niveaux seulement : le quota sera tenu, il manquera quelques
 * passages, ou le contrat décroche. Le seuil de 90 % correspond au moment où
 * le déficit devient visible dans les statistiques transmises au client.
 */
export function niveauConformite(compteurs: Compteurs): NiveauConformite {
  if (compteurs.deficit === 0) return 'conforme';
  return tauxConformitePourcent(compteurs) >= 90 ? 'attention' : 'critique';
}

const STYLE_NIVEAU: Record<NiveauConformite, { badge: string; texte: string; barre: string; bordure: string; libelle: string }> = {
  conforme: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    texte: 'text-emerald-700',
    barre: 'bg-emerald-500',
    bordure: 'border-l-2 border-l-emerald-400',
    libelle: 'Quota tenu',
  },
  attention: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    texte: 'text-amber-800',
    barre: 'bg-amber-500',
    bordure: 'border-l-2 border-l-amber-400',
    libelle: 'Déficit limité',
  },
  critique: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    texte: 'text-rose-700',
    barre: 'bg-rose-500',
    bordure: 'border-l-2 border-l-rose-500',
    libelle: 'Quota non tenu',
  },
};

export function styleNiveau(niveau: NiveauConformite) {
  return STYLE_NIVEAU[niveau];
}

/** Déficit chiffré, muet quand il est nul — la couleur ne sert qu'au problème. */
export function ValeurDeficit({ compteurs }: { compteurs: Compteurs }) {
  if (compteurs.deficit === 0) return <span className="text-gray-400">—</span>;
  const style = STYLE_NIVEAU[niveauConformite(compteurs)];
  return <span className={`font-semibold ${style.texte}`}>−{nombre(compteurs.deficit)}</span>;
}

/** Taux de conformité prévisionnel, avec sa jauge. */
export function JaugeConformite({ compteurs, largeur = 'w-24' }: { compteurs: Compteurs; largeur?: string }) {
  const taux = tauxConformitePourcent(compteurs);
  const style = STYLE_NIVEAU[niveauConformite(compteurs)];
  return (
    <div className="flex items-center justify-end gap-2">
      <span className={`tabular-nums text-xs font-semibold ${style.texte}`}>{pourcent(taux)}</span>
      <span className={`${largeur} h-1.5 overflow-hidden rounded-full bg-gray-200`} aria-hidden>
        <span className={`block h-full ${style.barre}`} style={{ width: `${Math.max(2, Math.min(100, taux))}%` }} />
      </span>
    </div>
  );
}

export function BadgeNiveau({ compteurs }: { compteurs: Compteurs }) {
  const style = STYLE_NIVEAU[niveauConformite(compteurs)];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style.badge}`}>
      {style.libelle}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Chiffres de tête
// ---------------------------------------------------------------------------

export function Tuile({
  libelle,
  valeur,
  precision,
  accent = 'neutre',
}: {
  libelle: string;
  valeur: string;
  precision?: string;
  accent?: 'neutre' | 'deficit' | 'positif';
}) {
  const couleurValeur =
    accent === 'deficit' ? 'text-rose-700' : accent === 'positif' ? 'text-emerald-700' : 'text-gray-900';
  const couleurCadre = accent === 'deficit' ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200 bg-white';
  return (
    <div className={`rounded-lg border px-4 py-3 ${couleurCadre}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${couleurValeur}`}>{valeur}</p>
      {precision && <p className="mt-0.5 text-xs text-gray-500">{precision}</p>}
    </div>
  );
}

/** Le bandeau des cinq chiffres : dû, réalisé, planifié, déficit, taux. */
export function BandeauCompteurs({
  compteurs,
  precisionDeficit,
}: {
  compteurs: Compteurs;
  precisionDeficit?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Tuile libelle="Passages dus" valeur={nombre(compteurs.dues)} precision="Quota contractuel annuel" />
      <Tuile libelle="Réalisés" valeur={nombre(compteurs.realisees)} />
      <Tuile
        libelle="Planifiés restants"
        valeur={nombre(compteurs.planifieesRestantes)}
        precision={compteurs.enRetard > 0 ? `dont ${nombre(compteurs.enRetard)} en retard` : undefined}
      />
      <Tuile
        libelle="Déficit prévisible"
        valeur={compteurs.deficit === 0 ? '0' : `−${nombre(compteurs.deficit)}`}
        precision={precisionDeficit}
        accent={compteurs.deficit === 0 ? 'positif' : 'deficit'}
      />
      <Tuile
        libelle="Conformité prévisionnelle"
        valeur={pourcent(tauxConformitePourcent(compteurs))}
        accent={compteurs.deficit === 0 ? 'positif' : 'neutre'}
      />
    </div>
  );
}

/**
 * Deux causes, deux réactions : replanifier des dates jamais posées n'est pas
 * le même travail que rattraper des passages annulés.
 */
export function OrigineDuDeficit({ compteurs }: { compteurs: Compteurs }) {
  if (compteurs.deficit === 0) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
        Le calendrier annuel porte l&apos;intégralité des passages dus et aucun n&apos;a été annulé : le quota sera tenu.
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Origine du déficit</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm">
            <span className="font-semibold tabular-nums text-rose-700">{nombre(compteurs.deficitCalendrier)}</span>
            <span className="ml-2 font-medium text-gray-900">défaut de calendrier</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            Dates jamais inscrites au calendrier annuel. Aucune exécution ne peut les rattraper : il faut les poser.
          </p>
        </div>
        <div>
          <p className="text-sm">
            <span className="font-semibold tabular-nums text-rose-700">{nombre(compteurs.deficitExecution)}</span>
            <span className="ml-2 font-medium text-gray-900">défaut d&apos;exécution</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            Passages inscrits puis annulés sans être replanifiés dans l&apos;année.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tableaux
// ---------------------------------------------------------------------------

export const CLASSE_TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';
export const CLASSE_TH_NUM = `${CLASSE_TH} text-right`;
export const CLASSE_TD = 'px-3 py-2 text-sm text-gray-700';
export const CLASSE_TD_NUM = `${CLASSE_TD} text-right tabular-nums`;

export function CadreTableau({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <header className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{titre}</h2>
        {sousTitre && <p className="mt-0.5 text-xs text-gray-500">{sousTitre}</p>}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

/** Catégories dont le quota annuel n'est pas exprimable depuis le contrat (voir l'hypothèse du module de calcul). */
const SANS_QUOTA_CONTRACTUEL: CategorieMaintenance[] = [CategorieMaintenance.NETTOYAGE, CategorieMaintenance.AUTRE];

/** Décomposition du quota par catégorie d'opération — identique à tous les niveaux d'agrégation. */
export function TableauCategories({ lignes }: { lignes: CompteursCategorie[] }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className={CLASSE_TH}>Opération</th>
          <th className={CLASSE_TH_NUM}>Dus</th>
          <th className={CLASSE_TH_NUM}>Réalisés</th>
          <th className={CLASSE_TH_NUM}>Planifiés</th>
          <th className={CLASSE_TH_NUM}>En retard</th>
          <th className={CLASSE_TH_NUM}>Annulés</th>
          <th className={CLASSE_TH_NUM}>Déficit</th>
          <th className={CLASSE_TH_NUM}>Conformité</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {lignes.map((ligne) => (
          <tr key={ligne.categorie} className={ligne.deficit > 0 ? 'bg-rose-50/30' : undefined}>
            <td className={`${CLASSE_TD} font-medium text-gray-900`}>
              {LIBELLE_CATEGORIE_MAINTENANCE[ligne.categorie]}
              {SANS_QUOTA_CONTRACTUEL.includes(ligne.categorie) && (
                <span className="ml-2 text-xs font-normal text-gray-400" title="Le contrat ne porte pas de cadence pour cette opération : le quota est déduit du calendrier annuel.">
                  quota déduit du calendrier
                </span>
              )}
            </td>
            <td className={CLASSE_TD_NUM}>{nombre(ligne.dues)}</td>
            <td className={CLASSE_TD_NUM}>{nombre(ligne.realisees)}</td>
            <td className={CLASSE_TD_NUM}>{nombre(ligne.planifieesRestantes)}</td>
            <td className={`${CLASSE_TD_NUM} ${ligne.enRetard > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
              {ligne.enRetard > 0 ? nombre(ligne.enRetard) : '—'}
            </td>
            <td className={`${CLASSE_TD_NUM} ${ligne.annulees > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
              {ligne.annulees > 0 ? nombre(ligne.annulees) : '—'}
            </td>
            <td className={CLASSE_TD_NUM}>
              <ValeurDeficit compteurs={ligne} />
            </td>
            <td className={CLASSE_TD_NUM}>
              <JaugeConformite compteurs={ligne} largeur="w-16" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
