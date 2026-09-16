/**
 * Accueil technicien (section 19). Volontairement dense mais scannable :
 * une bande d'état de connexion, un indicateur de synchronisation discret,
 * le début/fin de journée (section 37), puis 4 blocs de charge du jour
 * (urgent, aujourd'hui, en retard, cette semaine) construits par
 * lib/derived/accueil-technicien.ts.
 */

import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { EtatConnexionMobile, StatutSessionTechnicien } from '@/domain/types';
import { getSessionActiveDuTechnicien, getTourneesByTechnicienId } from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import {
  construireBlocsAccueilTechnicien,
  compterElementsSyncEnAttente,
  type ItemAccueilIntervention,
  type ItemAccueilMaintenance,
  type ItemAccueilReserve,
} from '@/lib/derived/accueil-technicien';
import { LIBELLE_CATEGORIE_MAINTENANCE, LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { cn } from '@/lib/utils';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { GraviteReserveBadge, PrioriteInterventionBadge, StatutMaintenanceBadge, StatutReserveBadge } from '@/components/StatusBadges';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import WidgetPTI from '@/app/mobile/components/WidgetPTI';
import { basculerJourneeTechnicien } from './actions';

const LIMITE_LIGNES_PAR_BLOC = 6;

function LigneAppareil({ code, ville }: { code?: string; ville?: string }) {
  return <p className="truncate text-xs text-gray-500">{code ? `${code}${ville ? ` — ${ville}` : ''}` : 'Appareil inconnu'}</p>;
}

function LigneIntervention({ item }: { item: ItemAccueilIntervention }) {
  const { intervention, ascenseur } = item;
  return (
    <Link
      href={`/mobile/interventions/${intervention.id}/demarrage`}
      className="flex items-start justify-between gap-2 border-b border-gray-100 py-2 last:border-0 active:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{LIBELLE_MOTIF_INTERVENTION[intervention.motif]}</p>
        <LigneAppareil code={ascenseur?.code} ville={ascenseur?.ville} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <PrioriteInterventionBadge priorite={intervention.priorite} />
        <StatutInterventionBadge statut={intervention.statut} />
      </div>
    </Link>
  );
}

function LigneMaintenance({ item, afficherRetard }: { item: ItemAccueilMaintenance; afficherRetard?: boolean }) {
  const { maintenance, ascenseur } = item;
  const categories = maintenance.categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(' + ');
  return (
    <Link
      href={`/mobile/maintenances/${maintenance.id}`}
      className="flex items-start justify-between gap-2 border-b border-gray-100 py-2 last:border-0 active:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{categories}</p>
        <LigneAppareil code={ascenseur?.code} ville={ascenseur?.ville} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {afficherRetard && maintenance.retardJours > 0 ? (
          <span className="text-xs font-semibold text-rose-600">
            {maintenance.retardJours} jour{maintenance.retardJours > 1 ? 's' : ''} de retard
          </span>
        ) : (
          <StatutMaintenanceBadge statut={maintenance.statut} />
        )}
      </div>
    </Link>
  );
}

function LigneReserve({ item }: { item: ItemAccueilReserve }) {
  const { reserve, ascenseur } = item;
  return (
    <Link
      href={`/mobile/ctq?appareilId=${reserve.appareilId}`}
      className="flex items-start justify-between gap-2 border-b border-gray-100 py-2 last:border-0 active:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">Réserve CTQ {reserve.numero}</p>
        <LigneAppareil code={ascenseur?.code} ville={ascenseur?.ville} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <GraviteReserveBadge gravite={reserve.gravite} />
        <StatutReserveBadge statut={reserve.statut} />
      </div>
    </Link>
  );
}

function BlocSection({
  titre,
  Icon,
  tonalite,
  count,
  texteVide,
  children,
}: {
  titre: string;
  Icon: typeof AlertTriangle;
  tonalite: 'rose' | 'sky' | 'amber' | 'indigo';
  count: number;
  texteVide: string;
  children: React.ReactNode;
}) {
  const tonalites: Record<typeof tonalite, string> = {
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', tonalites[tonalite])}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="flex-1 text-sm font-semibold text-gray-900">{titre}</h2>
        {count > 0 && <span className="text-xs font-medium text-gray-400">{count}</span>}
      </div>
      {count === 0 ? <p className="py-1 text-xs text-gray-400">{texteVide}</p> : <div>{children}</div>}
    </section>
  );
}

export default function AccueilMobilePage() {
  const technicien = getTechnicienConnecte();
  const session = getSessionActiveDuTechnicien(technicien.id);
  const etatConnexion = session?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;
  const enJournee = session?.statut === StatutSessionTechnicien.EN_COURS;
  const tourneeDuJour = getTourneesByTechnicienId(technicien.id)[0];

  const blocs = construireBlocsAccueilTechnicien(technicien.id);
  const nombreEnAttenteSync = compterElementsSyncEnAttente(technicien.id);

  const prenom = technicien.nomComplet.split(' ')[0];
  const dateDuJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="flex items-start justify-between px-4 pb-2 pt-4">
        <div>
          <p className="text-xs capitalize text-gray-500">{dateDuJour}</p>
          <h1 className="text-lg font-semibold text-gray-900">Bonjour {prenom}</h1>
        </div>
        <Link href="/mobile/connexion" className="mt-1 shrink-0 text-[11px] text-gray-400 underline underline-offset-2">
          Changer de technicien
        </Link>
      </div>

      <Link
        href="/mobile/synchronisation"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          {nombreEnAttenteSync === 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
          )}
          {nombreEnAttenteSync === 0 ? 'Tout est synchronisé' : `${nombreEnAttenteSync} élément${nombreEnAttenteSync > 1 ? 's' : ''} en attente`}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
      </Link>

      <div className="mx-4 mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Tournée du jour</p>
            <p className="truncate text-sm font-medium text-gray-900">
              {tourneeDuJour ? `${tourneeDuJour.nom} — ${tourneeDuJour.ville}` : 'Aucune tournée titulaire'}
            </p>
          </div>
        </div>
        <form action={basculerJourneeTechnicien}>
          <button
            type="submit"
            className={cn(
              'w-full rounded-lg py-2.5 text-sm font-semibold text-white',
              enJournee ? 'bg-gray-700 active:bg-gray-800' : 'bg-emerald-600 active:bg-emerald-700'
            )}
          >
            {enJournee ? 'Fin de journée' : 'Début de journée'}
          </button>
        </form>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
        {blocs.urgent.length > 0 && (
          <BlocSection titre="Urgent" Icon={AlertTriangle} tonalite="rose" count={blocs.urgent.length} texteVide="">
            {blocs.urgent.slice(0, LIMITE_LIGNES_PAR_BLOC).map((item) => (
              <LigneIntervention key={item.intervention.id} item={item} />
            ))}
          </BlocSection>
        )}

        <BlocSection titre="À faire aujourd'hui" Icon={Clock} tonalite="sky" count={blocs.aujourdhui.length} texteVide="Rien de prévu pour aujourd'hui.">
          {blocs.aujourdhui.slice(0, LIMITE_LIGNES_PAR_BLOC).map((item) => {
            if (item.nature === 'intervention') return <LigneIntervention key={`int-${item.intervention.id}`} item={item} />;
            if (item.nature === 'maintenance') return <LigneMaintenance key={`mnt-${item.maintenance.id}`} item={item} />;
            return <LigneReserve key={`res-${item.reserve.id}`} item={item} />;
          })}
          {blocs.aujourdhui.length > LIMITE_LIGNES_PAR_BLOC && (
            <p className="pt-1.5 text-[11px] text-gray-400">+ {blocs.aujourdhui.length - LIMITE_LIGNES_PAR_BLOC} de plus</p>
          )}
        </BlocSection>

        <BlocSection titre="En retard" Icon={AlertTriangle} tonalite="rose" count={blocs.enRetard.length} texteVide="Aucune maintenance en retard.">
          {blocs.enRetard.slice(0, LIMITE_LIGNES_PAR_BLOC).map((item) => (
            <LigneMaintenance key={item.maintenance.id} item={item} afficherRetard />
          ))}
        </BlocSection>

        <BlocSection titre="Cette semaine" Icon={CalendarClock} tonalite="indigo" count={blocs.cetteSemaine.length} texteVide="Aucun travaux planifié cette semaine.">
          {blocs.cetteSemaine.slice(0, LIMITE_LIGNES_PAR_BLOC).map((item) => (
            <LigneMaintenance key={item.maintenance.id} item={item} />
          ))}
        </BlocSection>

        <WidgetPTI technicienId={technicien.id} />
      </div>
    </div>
  );
}
