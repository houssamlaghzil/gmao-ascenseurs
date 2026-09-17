/**
 * Conformité contractuelle — détail d'un contrat.
 *
 * Descend d'un cran sous la ligne de l'écran parc : quels appareils précis
 * composent le déficit du contrat, et de combien chacun. Chaque appareil mène
 * à sa fiche, où se trouve le calendrier de maintenance à corriger.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Check, X } from 'lucide-react';
import { StatutContratBadge } from '@/components/StatusBadges';
import { LienAppareil, LienClient, LienContrat, LienStatut } from '@/components/Liens';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import { LIBELLE_FREQUENCE_MAINTENANCE, LIBELLE_NIVEAU_SLA } from '@/lib/derived/libelles-contrats';
import { paginerLignes } from '@/lib/derived/parc-liste';
import {
  ConformiteAppareil,
  getConformiteDetailContrat,
  lireAnnee,
} from '@/lib/derived/conformite-contractuelle';
import {
  BadgeNiveau,
  BandeauCompteurs,
  CadreTableau,
  CLASSE_TD,
  CLASSE_TD_NUM,
  CLASSE_TH,
  CLASSE_TH_NUM,
  JaugeConformite,
  OrigineDuDeficit,
  TableauCategories,
  ValeurDeficit,
  niveauConformite,
  nombre,
  styleNiveau,
} from '../components/ConformiteUI';

export const dynamic = 'force-dynamic';

const APPAREILS_PAR_PAGE = 50;

interface DetailConformitePageProps {
  params: { contratId: string };
  searchParams: { annee?: string | string[]; page?: string | string[] };
}

function lirePage(valeur: string | string[] | undefined): number {
  const texte = Array.isArray(valeur) ? valeur[0] : valeur;
  const page = Number(texte);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function Inclusion({ label, incluse }: { label: string; incluse: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {incluse ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-gray-300" />}
      <span className={incluse ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
    </span>
  );
}

/** Les catégories déficitaires d'un appareil, en clair — c'est ce qu'il faut replanifier. */
function CategoriesEnDeficit({ appareil }: { appareil: ConformiteAppareil }) {
  const manquantes = appareil.parCategorie.filter((c) => c.deficit > 0);
  if (manquantes.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {manquantes.map((c) => (
        <span
          key={c.categorie}
          className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
          title={`${c.realisees} réalisée(s) + ${c.planifieesRestantes} planifiée(s) pour ${c.dues} due(s)`}
        >
          {LIBELLE_CATEGORIE_MAINTENANCE[c.categorie]}
          <span className="font-semibold tabular-nums">−{c.deficit}</span>
        </span>
      ))}
    </span>
  );
}

export default function DetailConformiteContratPage({ params, searchParams }: DetailConformitePageProps) {
  const annee = lireAnnee(searchParams?.annee);
  const detail = getConformiteDetailContrat(params.contratId, annee);
  if (!detail) notFound();

  const page = paginerLignes(detail.appareils, lirePage(searchParams?.page), APPAREILS_PAR_PAGE);
  const contrat = detail.contrat;
  /** Conserve l'exercice consulté d'une page à l'autre. */
  const parametresPage = (numero: number): string => {
    const query = new URLSearchParams();
    if (searchParams?.annee) query.set('annee', String(annee));
    if (numero > 1) query.set('page', String(numero));
    const texte = query.toString();
    return texte ? `?${texte}` : '';
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/conformite${searchParams?.annee ? `?annee=${annee}` : ''}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Conformité contractuelle {annee}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {detail.numero}
            <StatutContratBadge statut={detail.statutContrat} />
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            <LienClient id={detail.clientId} ton="sobre">
              {detail.clientNom}
            </LienClient>
            <span className="mx-2 text-gray-300">·</span>
            <LienContrat id={detail.contratId} ton="sobre">
              {nombre(detail.nombreAppareils)} appareil{detail.nombreAppareils > 1 ? 's' : ''} couvert
              {detail.nombreAppareils > 1 ? 's' : ''}
            </LienContrat>
            <span className="mx-2 text-gray-300">·</span>
            Exercice {annee}
          </p>
        </div>
        <BadgeNiveau compteurs={detail.total} />
      </header>

      <section className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Champ label="Cadence périodique">{LIBELLE_FREQUENCE_MAINTENANCE[detail.frequenceMaintenance]}</Champ>
          <Champ label="Niveau de service">{contrat ? LIBELLE_NIVEAU_SLA[contrat.niveauSla] : '—'}</Champ>
          <Champ label="Période contractuelle">
            {contrat ? `${formatDateCourte(contrat.dateDebut)} → ${formatDateCourte(contrat.dateFin)}` : '—'}
          </Champ>
          <Champ label="Opérations incluses">
            <span className="flex flex-wrap gap-3">
              <Inclusion label="Câble" incluse={contrat?.maintenanceCableIncluse ?? false} />
              <Inclusion label="Parachute" incluse={contrat?.maintenanceParachuteIncluse ?? false} />
              <Inclusion label="Nettoyage" incluse={contrat?.maintenanceNettoyageIncluse ?? false} />
            </span>
          </Champ>
        </dl>
      </section>

      <BandeauCompteurs
        compteurs={detail.total}
        precisionDeficit={
          detail.nombreAppareilsEnDeficit > 0
            ? `réparti sur ${nombre(detail.nombreAppareilsEnDeficit)} appareil${detail.nombreAppareilsEnDeficit > 1 ? 's' : ''}`
            : undefined
        }
      />

      <OrigineDuDeficit compteurs={detail.total} />

      <CadreTableau titre="Décomposition par opération" sousTitre="Quota annuel du contrat, toutes catégories confondues.">
        <TableauCategories lignes={detail.parCategorie} />
      </CadreTableau>

      <CadreTableau
        titre="Appareils du contrat"
        sousTitre={`${nombre(page.total)} appareil${page.total > 1 ? 's' : ''}, les plus déficitaires d'abord. ${nombre(detail.nombreAppareilsEnDeficit)} n'atteindra${detail.nombreAppareilsEnDeficit > 1 ? 'ont' : ''} pas son quota ${annee}.`}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={CLASSE_TH}>Appareil</th>
              <th className={CLASSE_TH}>Adresse</th>
              <th className={CLASSE_TH}>Statut</th>
              <th className={CLASSE_TH}>Opérations manquantes</th>
              <th className={CLASSE_TH_NUM}>Dus</th>
              <th className={CLASSE_TH_NUM}>Réalisés</th>
              <th className={CLASSE_TH_NUM}>Planifiés</th>
              <th className={CLASSE_TH_NUM}>En retard</th>
              <th className={CLASSE_TH_NUM}>Déficit</th>
              <th className={CLASSE_TH_NUM}>Conformité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {page.lignesPage.map((appareil) => {
              const niveau = niveauConformite(appareil.total);
              const style = styleNiveau(niveau);
              return (
                <tr
                  key={appareil.ascenseurId}
                  className={`${style.bordure} ${niveau === 'critique' ? 'bg-rose-50/40' : niveau === 'attention' ? 'bg-amber-50/20' : ''}`}
                >
                  <td className={CLASSE_TD}>
                    <LienAppareil ascenseurId={appareil.ascenseurId} className="font-semibold">
                      {appareil.code}
                    </LienAppareil>
                  </td>
                  <td className={`${CLASSE_TD} text-gray-500`}>
                    {appareil.adresse}
                    <span className="ml-1 text-gray-400">· {appareil.ville}</span>
                  </td>
                  <td className={CLASSE_TD}>
                    <LienStatut statut={appareil.statutAppareil} />
                  </td>
                  <td className={CLASSE_TD}>
                    <CategoriesEnDeficit appareil={appareil} />
                  </td>
                  <td className={`${CLASSE_TD_NUM} font-medium text-gray-900`}>{nombre(appareil.total.dues)}</td>
                  <td className={CLASSE_TD_NUM}>{nombre(appareil.total.realisees)}</td>
                  <td className={CLASSE_TD_NUM}>{nombre(appareil.total.planifieesRestantes)}</td>
                  <td className={`${CLASSE_TD_NUM} ${appareil.total.enRetard > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                    {appareil.total.enRetard > 0 ? nombre(appareil.total.enRetard) : '—'}
                  </td>
                  <td className={CLASSE_TD_NUM}>
                    <ValeurDeficit compteurs={appareil.total} />
                  </td>
                  <td className={CLASSE_TD_NUM}>
                    <JaugeConformite compteurs={appareil.total} largeur="w-16" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {page.totalPages > 1 && (
          <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm">
            <span className="text-gray-500">
              Page {page.pageActuelle} sur {page.totalPages}
            </span>
            <span className="flex gap-2">
              {page.pageActuelle > 1 && (
                <Link
                  href={`/conformite/${detail.contratId}${parametresPage(page.pageActuelle - 1)}`}
                  className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                >
                  Précédent
                </Link>
              )}
              {page.pageActuelle < page.totalPages && (
                <Link
                  href={`/conformite/${detail.contratId}${parametresPage(page.pageActuelle + 1)}`}
                  className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                >
                  Suivant
                </Link>
              )}
            </span>
          </nav>
        )}
      </CadreTableau>
    </div>
  );
}
