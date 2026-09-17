/**
 * Sidebar contextuelle de site — colonne de droite de la fiche appareil.
 *
 * Raison d'être : un appareil ne se lit jamais seul. Celui qui ouvre
 * « ASC-00412 » veut savoir dans la seconde sur quel site il se trouve,
 * combien d'appareils y sont installés, combien posent problème aujourd'hui,
 * sous quel contrat et quel technicien — et surtout passer à l'appareil
 * voisin sans repasser par la liste. C'est exactement ce que le logiciel
 * concurrent oblige à faire : revenir, refiltrer, recliquer.
 *
 * Aucun chiffre n'est un cul-de-sac : chaque compteur par statut mène à
 * l'exploration du site filtrée sur ce statut, le bloc « posent problème »
 * mène à la même exploration avec le critère problème (en panne + à l'arrêt),
 * et chaque appareil frère mène à sa fiche.
 *
 * Server Component : toutes les agrégations sont faites ici, côté serveur,
 * en réutilisant les fonctions mémoïsées de lib/derived/explorer.ts.
 */

import { ReactNode } from 'react';
import { AlertTriangle, ArrowRight, Building2, MapPin, Route as RouteIcon, ShieldCheck, UserRound } from 'lucide-react';
import { Ascenseur, Client, Contrat, ParcAscenseurs, StatutAppareil, Technicien, Tournee } from '@/domain/types';
import { getDefinitionsSLAParContrat } from '@/data/store';
import { calculerRepartition, listerTousAppareilsDuGroupe } from '@/lib/derived/explorer';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import { LIBELLE_FREQUENCE_MAINTENANCE, LIBELLE_NIVEAU_SLA } from '@/lib/derived/libelles-contrats';
import { LIBELLE_NIVEAU_URGENCE } from '@/lib/derived/libelles-interventions';
import {
  LienAppareil,
  LienClient,
  LienContrat,
  LienGroupe,
  LienSite,
  LienTechnicien,
  LienTournee,
  LienVille,
  PastilleStatut,
} from '@/components/Liens';

/** Ordre d'affichage : le service d'abord, puis la gravité décroissante. */
const ORDRE_STATUTS: StatutAppareil[] = [
  StatutAppareil.EN_SERVICE,
  StatutAppareil.EN_PANNE,
  StatutAppareil.A_L_ARRET,
  StatutAppareil.MODE_DEGRADE,
  StatutAppareil.ARRET_TRAVAUX,
];

/** Couleurs pleines de la barre de répartition (la pastille des listes vient de components/Liens). */
const COULEUR_SEGMENT: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_SERVICE]: 'bg-emerald-500',
  [StatutAppareil.EN_PANNE]: 'bg-rose-500',
  [StatutAppareil.A_L_ARRET]: 'bg-orange-500',
  [StatutAppareil.MODE_DEGRADE]: 'bg-amber-500',
  [StatutAppareil.ARRET_TRAVAUX]: 'bg-slate-400',
};

/** Au-delà de ce nombre de frères, la liste défile au lieu d'allonger la page. */
const SEUIL_LISTE_DEFILANTE = 12;

function formatDelai(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`;
}

function Carte({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Intitule({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{children}</p>;
}

interface SidebarSiteProps {
  ascenseur: Ascenseur;
  parc?: ParcAscenseurs;
  client?: Client;
  contrat?: Contrat;
  technicien?: Technicien;
  tournee?: Tournee;
}

export default function SidebarSite({ ascenseur, parc, client, contrat, technicien, tournee }: SidebarSiteProps) {
  // Tous les appareils du site, filtres ignorés : la sidebar décrit le site tel
  // qu'il est, pas le sous-ensemble par lequel on est arrivé jusqu'ici.
  const appareilsDuSite = parc ? listerTousAppareilsDuGroupe('parc', parc.id) : [ascenseur];
  const repartition = calculerRepartition(appareilsDuSite);
  const freres = [...appareilsDuSite].sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  const listeDefilante = freres.length > SEUIL_LISTE_DEFILANTE;

  // SLA applicable : surcharges du contrat si elles existent, sinon barème global.
  const surcharges = contrat ? getDefinitionsSLAParContrat(contrat.id) : [];
  const slas = (surcharges.length > 0 ? surcharges : getDefinitionsSLAParContrat(undefined))
    .slice()
    .sort((a, b) => a.delaiMinutes - b.delaiMinutes);

  const adresse = parc?.adresse ?? ascenseur.adresseComplete;
  const ville = parc?.ville ?? ascenseur.ville;

  return (
    // Le <aside> occupe toute la hauteur de la cellule de grille pour que le
    // bloc intérieur puisse rester collé au défilement sur grand écran.
    <aside className="lg:h-full" aria-label="Contexte du site">
      {/* Collé au défilement sur grand écran, et jamais plus haut que l'écran :
          sur un portable 13 pouces, le bas de la colonne reste atteignable. */}
      <div className="space-y-3 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
        {/* ---- Identité du site ---- */}
        <Carte className="p-4">
          <Intitule>Site</Intitule>
          <h2 className="mt-1 text-sm font-semibold leading-snug text-gray-900">
            {parc ? <LienSite id={parc.id}>{parc.nom}</LienSite> : 'Site non rattaché'}
          </h2>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            {/* L'adresse porte déjà la ville : le lien vers la dimension
                « ville » annonce donc sa destination au lieu de répéter le nom. */}
            <span className="min-w-0">
              {adresse}
              <br />
              <LienVille id={ville} ton="sobre">
                Tout le parc de {ville}
              </LienVille>
            </span>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {client ? (
              <LienClient id={client.id} ton="sobre" className="min-w-0">
                <span className="truncate">{client.raisonSociale}</span>
              </LienClient>
            ) : (
              <span className="text-gray-400">Client inconnu</span>
            )}
          </p>
        </Carte>

        {/* ---- Répartition des états du site ---- */}
        <Carte className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <Intitule>État du site</Intitule>
            <span className="text-xs tabular-nums text-gray-500">{repartition.disponibilitePourcent} % en service</span>
          </div>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums leading-none text-gray-900">{repartition.total}</span>
            <span className="text-xs text-gray-500">appareil{repartition.total > 1 ? 's' : ''}</span>
          </p>

          <div
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`Répartition des états des ${repartition.total} appareils du site`}
          >
            {ORDRE_STATUTS.map((statut) => {
              const nombre = repartition.parStatut[statut];
              if (nombre === 0 || repartition.total === 0) return null;
              return (
                <span
                  key={statut}
                  className={COULEUR_SEGMENT[statut]}
                  style={{ width: `${(nombre / repartition.total) * 100}%` }}
                  title={`${LIBELLE_STATUT_APPAREIL[statut]} : ${nombre}`}
                />
              );
            })}
          </div>

          <ul className="mt-3 space-y-1.5">
            {ORDRE_STATUTS.map((statut) => {
              const nombre = repartition.parStatut[statut];
              return (
                <li key={statut} className="flex items-center justify-between gap-2 text-xs">
                  {nombre > 0 && parc ? (
                    <LienGroupe dimension="parc" valeur={parc.id} filtres={{ statut }} ton="sobre" className="min-w-0">
                      <PastilleStatut statut={statut} />
                      <span className="truncate">{LIBELLE_STATUT_APPAREIL[statut]}</span>
                    </LienGroupe>
                  ) : (
                    <span className="inline-flex min-w-0 items-center gap-1 text-gray-400">
                      <PastilleStatut statut={statut} className="opacity-40" />
                      <span className="truncate">{LIBELLE_STATUT_APPAREIL[statut]}</span>
                    </span>
                  )}
                  <span className={`shrink-0 tabular-nums ${nombre > 0 ? 'font-semibold text-gray-900' : 'text-gray-300'}`}>
                    {nombre}
                  </span>
                </li>
              );
            })}
          </ul>
        </Carte>

        {/* ---- Ce qui pose problème sur le site (demande explicite du client) ---- */}
        {repartition.problemes > 0 ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="min-w-0">
                <p className="text-2xl font-semibold tabular-nums leading-none text-rose-700">{repartition.problemes}</p>
                <p className="mt-1 text-xs font-medium text-rose-900">
                  appareil{repartition.problemes > 1 ? 's' : ''} en panne ou à l’arrêt sur ce site
                </p>
                {parc && (
                  <LienGroupe
                    dimension="parc"
                    valeur={parc.id}
                    filtres={{ probleme: true }}
                    ton="sobre"
                    className="mt-2 text-xs font-medium"
                  >
                    Voir lesquels <ArrowRight className="h-3 w-3" />
                  </LienGroupe>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Aucun appareil en panne ni à l’arrêt sur ce site.
          </div>
        )}

        {/* ---- Contrat applicable et SLA ---- */}
        <Carte className="p-4">
          <Intitule>Contrat applicable</Intitule>
          {contrat ? (
            <>
              <p className="mt-1 text-sm font-medium">
                <LienContrat id={contrat.id}>{contrat.numero}</LienContrat>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                SLA {LIBELLE_NIVEAU_SLA[contrat.niveauSla]} · maintenance{' '}
                {LIBELLE_FREQUENCE_MAINTENANCE[contrat.frequenceMaintenance].toLowerCase()}
              </p>
              <dl className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {slas.map((sla) => (
                  <div key={sla.id} className="flex items-center justify-between gap-2 text-xs">
                    <dt className="min-w-0 truncate text-gray-500">{LIBELLE_NIVEAU_URGENCE[sla.niveauUrgence]}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums text-gray-900">{formatDelai(sla.delaiMinutes)}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Aucun contrat rattaché à cet appareil.</p>
          )}
        </Carte>

        {/* ---- Affectation terrain ---- */}
        <Carte className="space-y-2 p-4">
          <Intitule>Terrain</Intitule>
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {technicien ? (
              <LienTechnicien id={technicien.id} ton="sobre" className="min-w-0">
                <span className="truncate">{technicien.nomComplet}</span>
              </LienTechnicien>
            ) : (
              <span className="text-gray-400">Aucun technicien titulaire</span>
            )}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <RouteIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {tournee ? (
              <LienTournee id={tournee.id} ton="sobre" className="min-w-0">
                <span className="truncate">{tournee.nom}</span>
              </LienTournee>
            ) : (
              <span className="text-gray-400">Hors tournée</span>
            )}
          </p>
        </Carte>

        {/* ---- Appareils frères : passer de l'un à l'autre sans repasser par la liste ---- */}
        <Carte className="overflow-hidden">
          <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <Intitule>Appareils du site</Intitule>
            <span className="text-xs tabular-nums text-gray-400">{freres.length}</span>
          </div>
          <ul className={`p-1.5 ${listeDefilante ? 'max-h-[21rem] overflow-y-auto' : ''}`}>
            {freres.map((appareil) => {
              const courant = appareil.id === ascenseur.id;
              if (courant) {
                return (
                  <li key={appareil.id}>
                    <div
                      aria-current="page"
                      className="flex items-center gap-2 rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-900 ring-1 ring-inset ring-indigo-100"
                    >
                      <PastilleStatut statut={appareil.statutAppareil} />
                      <span className="truncate">{appareil.code}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-wide text-indigo-500">
                        Affiché
                      </span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={appareil.id}>
                  <LienAppareil
                    ascenseurId={appareil.id}
                    ton="sobre"
                    className="w-full justify-start gap-2 px-2 py-1.5 text-xs hover:bg-gray-50"
                  >
                    <PastilleStatut statut={appareil.statutAppareil} />
                    <span className="truncate">{appareil.code}</span>
                    {appareil.statutAppareil !== StatutAppareil.EN_SERVICE && (
                      <span className="ml-auto shrink-0 text-[10px] text-gray-400">
                        {LIBELLE_STATUT_APPAREIL[appareil.statutAppareil]}
                      </span>
                    )}
                  </LienAppareil>
                </li>
              );
            })}
          </ul>
          {parc && (
            <div className="border-t border-gray-100 px-4 py-2">
              <LienGroupe dimension="parc" valeur={parc.id} ton="sobre" className="text-xs">
                Explorer le site <ArrowRight className="h-3 w-3" />
              </LienGroupe>
            </div>
          )}
        </Carte>
      </div>
    </aside>
  );
}
