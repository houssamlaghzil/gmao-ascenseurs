/**
 * Démarrage/réalisation d'une maintenance (section 31) — Server Component :
 * lecture seule (maintenance, appareil), l'assistant multi-étapes vit dans
 * MaintenanceWizard ('use client' + Server Action unique à la fin).
 */

import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EtatConnexionMobile, StatutMaintenance } from '@/domain/types';
import { getAscenseurById, getMaintenanceById, getSessionActiveDuTechnicien } from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import { formatDate } from '@/lib/utils';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import { StatutMaintenanceBadge } from '@/components/StatusBadges';
import MaintenanceWizard from './MaintenanceWizard';

interface MaintenanceMobilePageProps {
  params: { id: string };
}

function MessageBlocage({ titre, detail }: { titre: string; detail?: string }) {
  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-medium text-amber-800">{titre}</p>
        {detail && <p className="mt-1 text-xs text-amber-700">{detail}</p>}
        <Link href="/mobile/maintenances" className="mt-3 inline-block text-xs font-medium text-amber-800 underline underline-offset-2">
          Retour à mes maintenances
        </Link>
      </div>
    </div>
  );
}

export default function MaintenanceMobilePage({ params }: MaintenanceMobilePageProps) {
  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;
  const maintenance = getMaintenanceById(params.id);

  if (!maintenance) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage titre="Maintenance introuvable" />
      </div>
    );
  }

  const ascenseur = getAscenseurById(maintenance.ascenseurId);

  if (maintenance.technicienId !== technicienId) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage titre="Maintenance non affectée" detail="Cette maintenance n'est pas affectée à votre compte." />
      </div>
    );
  }

  const dejaTerminee = maintenance.statut === StatutMaintenance.REALISEE || maintenance.statut === StatutMaintenance.ANNULEE;

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <p className="text-xs text-gray-500">{ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : 'Appareil inconnu'}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">{maintenance.categories.map((c) => LIBELLE_CATEGORIE_MAINTENANCE[c]).join(' + ')}</h1>
          <StatutMaintenanceBadge statut={maintenance.statut} />
        </div>
      </div>

      {dejaTerminee ? (
        <div className="mx-4 mt-2 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              {maintenance.statut === StatutMaintenance.REALISEE ? 'Cette maintenance a déjà été réalisée.' : 'Cette maintenance a été annulée.'}
            </p>
            {maintenance.dateRealisee && (
              <p className="mt-1 text-xs text-emerald-700">Réalisée le {formatDate(new Date(maintenance.dateRealisee))}</p>
            )}
            <Link href="/mobile/maintenances" className="mt-3 inline-block text-xs font-medium text-emerald-800 underline underline-offset-2">
              Retour à mes maintenances
            </Link>
          </div>
        </div>
      ) : (
        <MaintenanceWizard
          maintenanceId={maintenance.id}
          categoriesInitiales={maintenance.categories}
          seuilDureeMinimaleMinutes={maintenance.seuilDureeMinimaleMinutes}
          heureDebutExistante={maintenance.heureDebut}
        />
      )}
    </div>
  );
}
