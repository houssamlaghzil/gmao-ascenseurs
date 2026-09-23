/**
 * Liste des maintenances du technicien connecté (section 31.1/31.2) — trois
 * groupes dans l'ordre demandé (En retard → Cette semaine → À venir),
 * construits via lib/derived/maintenances-appareil.ts (retard, priorité
 * d'affichage), déjà utilisé côté web/appareil. Un `?appareilId=` filtre la
 * liste sur un appareil précis (venant de la fiche appareil mobile, bouton
 * "Démarrer une maintenance").
 *
 * Les maintenances déjà REALISEE/ANNULEE (prioriteAffichage = null) ne sont
 * volontairement pas listées ici : cet écran ne montre que ce qui reste à
 * faire (section 31.1).
 */

import Link from 'next/link';
import { AlertTriangle, CalendarClock, CalendarDays, ChevronRight, Wrench } from 'lucide-react';
import { EtatConnexionMobile, MaintenanceAvecUrgence, PrioriteAffichageMaintenance } from '@/domain/types';
import { getAscenseurById, getDateDemo, getMaintenancesByTechnicienId, getSessionActiveDuTechnicien } from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { enrichirMaintenance } from '@/lib/derived/maintenances-appareil';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import { formatDate } from '@/lib/utils';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';

export const dynamic = 'force-dynamic';

interface MaintenancesMobilePageProps {
  searchParams: { appareilId?: string };
}

function CarteMaintenance({ maintenance }: { maintenance: MaintenanceAvecUrgence }) {
  const ascenseur = getAscenseurById(maintenance.ascenseurId);

  return (
    <Link
      href={`/mobile/maintenances/${maintenance.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{ascenseur?.code ?? maintenance.ascenseurId}</p>
          <p className="truncate text-xs text-gray-500">{ascenseur ? `${ascenseur.adresseComplete}` : ''}</p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {maintenance.categories.map((c) => (
          <span key={c} className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            {LIBELLE_CATEGORIE_MAINTENANCE[c]}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Prévue le {formatDate(new Date(maintenance.datePrevue))}</p>
        {maintenance.retardJours > 0 && (
          <span className="text-[11px] font-semibold text-rose-600">
            {maintenance.retardJours} jour{maintenance.retardJours > 1 ? 's' : ''} de retard
          </span>
        )}
      </div>
    </Link>
  );
}

function Groupe({
  titre,
  Icon,
  tonalite,
  maintenances,
}: {
  titre: string;
  Icon: typeof AlertTriangle;
  tonalite: 'rose' | 'amber' | 'sky';
  maintenances: MaintenanceAvecUrgence[];
}) {
  if (maintenances.length === 0) return null;
  const tonalites: Record<typeof tonalite, string> = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tonalites[tonalite]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold text-gray-900">{titre}</h2>
        <span className="text-xs font-medium text-gray-400">{maintenances.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {maintenances.map((m) => (
          <CarteMaintenance key={m.id} maintenance={m} />
        ))}
      </div>
    </section>
  );
}

export default function MaintenancesMobilePage({ searchParams }: MaintenancesMobilePageProps) {
  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;
  const appareilId = searchParams.appareilId;

  const maintenant = getDateDemo();
  let maintenances = getMaintenancesByTechnicienId(technicienId).map((m) => enrichirMaintenance(m, maintenant));
  if (appareilId) maintenances = maintenances.filter((m) => m.ascenseurId === appareilId);

  const ouvertes = maintenances.filter((m) => m.prioriteAffichage !== null);
  const enRetard = ouvertes
    .filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.EN_RETARD)
    .sort((a, b) => b.retardJours - a.retardJours);
  const cetteSemaine = ouvertes
    .filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.CETTE_SEMAINE)
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime());
  const aVenir = ouvertes
    .filter((m) => m.prioriteAffichage === PrioriteAffichageMaintenance.A_VENIR)
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime());

  const ascenseurFiltre = appareilId ? getAscenseurById(appareilId) : undefined;

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <h1 className="text-lg font-semibold text-gray-900">Mes maintenances</h1>
      </div>

      {appareilId && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="truncate text-xs font-medium text-blue-700">
            Filtré sur {ascenseurFiltre?.code ?? appareilId}
          </p>
          <Link href="/mobile/maintenances" className="shrink-0 text-[11px] font-medium text-blue-700 underline underline-offset-2">
            Tout afficher
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        {ouvertes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <Wrench className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-500">
              {appareilId ? 'Aucune maintenance planifiée pour cet appareil.' : 'Aucune maintenance à réaliser pour le moment.'}
            </p>
          </div>
        ) : (
          <>
            <Groupe titre="En retard" Icon={AlertTriangle} tonalite="rose" maintenances={enRetard} />
            <Groupe titre="Cette semaine" Icon={CalendarClock} tonalite="amber" maintenances={cetteSemaine} />
            <Groupe titre="À venir" Icon={CalendarDays} tonalite="sky" maintenances={aVenir} />
          </>
        )}
      </div>
    </div>
  );
}
