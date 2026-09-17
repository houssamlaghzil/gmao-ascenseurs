/**
 * Bloc « Historique des états » de la fiche appareil — demande explicite du
 * client : « je veux voir l'historique de l'état de l'appareil ».
 *
 * L'état d'un appareil change par deux chemins distincts dans le modèle, et
 * un seul des deux ne raconterait qu'une moitié d'histoire :
 *   1. le journal de modifications (EntreeJournalModification) quand le champ
 *      modifié est le statut — passage en mode dégradé signalé depuis le
 *      mobile, remise en service saisie au bureau… ;
 *   2. les interventions, qui portent l'état constaté à l'arrivée du
 *      technicien (etatAppareilInitial) et celui laissé à la fin
 *      (etatAppareilFinal) — c'est la trace terrain, celle qui explique
 *      *pourquoi* l'état a bougé.
 *
 * Les deux sources sont fusionnées en un seul fil antéchronologique. Toute
 * entrée qui possède une source consultable (une intervention) est cliquable
 * en entier vers cette source ; les entrées de journal, qui n'ont pas de
 * document derrière elles, portent leur auteur et leur origine.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Ascenseur, ChampModifiable, EntreeJournalModification, Intervention, StatutAppareil } from '@/domain/types';
import StatusBadge from '@/components/StatusBadge';
import { LIBELLE_MOTIF_INTERVENTION, LIBELLE_ORIGINE_ACTION } from '@/lib/derived/libelles-parc';
import { formatDate } from '@/lib/utils';

/** Au-delà de ce nombre d'entrées, le fil défile au lieu d'allonger la page. */
const SEUIL_FIL_DEFILANT = 8;

/** Une ligne du fil, quelle que soit sa source. */
interface EvenementEtat {
  id: string;
  /** ISO — sert au tri et à l'affichage. */
  date: string;
  /** Nature de l'événement, en clair. */
  nature: string;
  ancien?: StatutAppareil;
  nouveau?: StatutAppareil;
  /** Valeurs brutes, utilisées seulement si elles ne correspondent à aucun statut connu. */
  ancienBrut?: string;
  nouveauBrut?: string;
  /** Auteur, origine ou motif — le contexte court affiché à droite. */
  meta?: string;
  /** Source consultable, quand elle existe. */
  lien?: { href: string; libelle: string };
}

function statutDepuisValeur(valeur: string): StatutAppareil | undefined {
  return Object.values(StatutAppareil).find((statut) => statut === valeur);
}

/**
 * Fusionne journal et interventions en un fil antéchronologique. Exporté pour
 * rester testable indépendamment du rendu.
 */
export function construireHistoriqueEtats(
  entrees: EntreeJournalModification[],
  interventions: Intervention[],
): EvenementEtat[] {
  const evenements: EvenementEtat[] = [];

  for (const entree of entrees) {
    if (entree.champModifie !== ChampModifiable.STATUT_APPAREIL) continue;
    evenements.push({
      id: `journal-${entree.id}`,
      date: entree.dateModification,
      nature: 'Changement de statut',
      ancien: statutDepuisValeur(entree.ancienneValeur),
      nouveau: statutDepuisValeur(entree.nouvelleValeur),
      ancienBrut: entree.ancienneValeur,
      nouveauBrut: entree.nouvelleValeur,
      meta: `${LIBELLE_ORIGINE_ACTION[entree.origine]} · ${entree.auteur.nomAffiche}`,
    });
  }

  for (const intervention of interventions) {
    const source = { href: `/interventions/${intervention.id}`, libelle: intervention.numero };

    if (intervention.dateArriveeSite && intervention.etatAppareilInitial) {
      evenements.push({
        id: `arrivee-${intervention.id}`,
        date: intervention.dateArriveeSite,
        nature: 'État constaté à l’arrivée du technicien',
        nouveau: intervention.etatAppareilInitial,
        meta: LIBELLE_MOTIF_INTERVENTION[intervention.motif],
        lien: source,
      });
    }

    const dateFin = intervention.dateTerminee ?? intervention.dateCloture ?? intervention.dateValidation;
    if (dateFin && intervention.etatAppareilFinal) {
      evenements.push({
        id: `fin-${intervention.id}`,
        date: dateFin,
        nature: 'État laissé en fin d’intervention',
        // L'état d'arrivée n'est rappelé que s'il diffère : sinon la ligne
        // affirmerait un changement qui n'a pas eu lieu.
        ancien:
          intervention.etatAppareilInitial !== intervention.etatAppareilFinal
            ? intervention.etatAppareilInitial
            : undefined,
        nouveau: intervention.etatAppareilFinal,
        meta: LIBELLE_MOTIF_INTERVENTION[intervention.motif],
        lien: source,
      });
    }
  }

  return evenements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

interface HistoriqueEtatsProps {
  ascenseur: Ascenseur;
  entrees: EntreeJournalModification[];
  interventions: Intervention[];
}

export default function HistoriqueEtats({ ascenseur, entrees, interventions }: HistoriqueEtatsProps) {
  const evenements = construireHistoriqueEtats(entrees, interventions);
  const filDefilant = evenements.length > SEUIL_FIL_DEFILANT;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Historique des états</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Changements de statut et constats terrain, du plus récent au plus ancien.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          État actuel
          <StatusBadge statut={ascenseur.statutAppareil} />
        </div>
      </header>

      {evenements.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-500">
          Aucun changement d’état enregistré pour cet appareil.
        </p>
      ) : (
        <ol className={`divide-y divide-gray-100 ${filDefilant ? 'max-h-[28rem] overflow-y-auto' : ''}`}>
          {evenements.map((evenement) => (
            <li
              key={evenement.id}
              className={`relative flex flex-col gap-1.5 px-6 py-3 sm:flex-row sm:items-center sm:gap-4 ${
                evenement.lien ? 'hover:bg-gray-50' : ''
              }`}
            >
              <time dateTime={evenement.date} className="shrink-0 text-xs tabular-nums text-gray-500 sm:w-40">
                {formatDate(new Date(evenement.date))}
              </time>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {(evenement.ancien || evenement.ancienBrut) && (
                  <>
                    {evenement.ancien ? (
                      <StatusBadge statut={evenement.ancien} />
                    ) : (
                      <span className="text-xs text-gray-500">{evenement.ancienBrut}</span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                  </>
                )}
                {evenement.nouveau ? (
                  <StatusBadge statut={evenement.nouveau} />
                ) : (
                  <span className="text-xs text-gray-500">{evenement.nouveauBrut ?? '—'}</span>
                )}
                <span className="truncate text-xs text-gray-600">{evenement.nature}</span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400 sm:justify-end">
                {evenement.meta}
                {evenement.lien && (
                  <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
                    {evenement.meta && <span className="text-gray-300">·</span>}
                    {evenement.lien.libelle}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                )}
              </div>

              {/* Entrée cliquable en entier vers sa source, quand elle en a une. */}
              {evenement.lien && (
                <Link
                  href={evenement.lien.href}
                  className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                >
                  <span className="sr-only">Ouvrir l’intervention {evenement.lien.libelle}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
