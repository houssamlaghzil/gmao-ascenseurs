/**
 * Une ligne de la vue prioritaire (section 6.2), pour un des 3 groupes
 * (en retard / cette semaine / à venir). Porte les règles d'affichage
 * spécifiques au module Maintenances :
 *
 * - 6.3 : datePrevue, dateRealisee et le retard sont montrés distinctement.
 *   `retardJours` vient de MaintenanceAvecUrgence (lib/derived/
 *   maintenances-appareil.ts), calculé à partir de datePrevue vs
 *   aujourd'hui — jamais recalculé depuis dateRealisee.
 * - 6.4 : quand `categories.length > 1`, les badges sont affichés ensemble
 *   sur la même ligne, séparés par un "+" (ex. "Périodique + Nettoyage").
 * - 6.5 : sur une maintenance EN_COURS_DE_REALISATION ou REALISEE, affiche
 *   heure d'arrivée/début/durée, le seuil contractuel et l'avertissement
 *   éventuel de durée insuffisante.
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { CategorieMaintenance, MaintenanceAvecUrgence, StatutMaintenance, TypeMaintenanceRef } from '@/domain/types';
import { getAscenseurById, getTechnicienById, getTourneeById } from '@/data/store';
import { CategorieMaintenanceBadge, StatutMaintenanceBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';

const STATUTS_AVEC_DUREE: StatutMaintenance[] = [StatutMaintenance.EN_COURS_DE_REALISATION, StatutMaintenance.REALISEE];

interface LigneMaintenanceProps {
  maintenance: MaintenanceAvecUrgence;
  typesMaintenanceRef: TypeMaintenanceRef[];
}

export default function LigneMaintenance({ maintenance, typesMaintenanceRef }: LigneMaintenanceProps) {
  const ascenseur = getAscenseurById(maintenance.ascenseurId);
  const technicien = maintenance.technicienId ? getTechnicienById(maintenance.technicienId) : undefined;
  const tournee = maintenance.tourneeId ? getTourneeById(maintenance.tourneeId) : undefined;

  const libellesAutre = maintenance.categories.includes(CategorieMaintenance.AUTRE)
    ? (maintenance.typesAutresIds ?? [])
        .map((id) => typesMaintenanceRef.find((t) => t.id === id)?.libelle)
        .filter((libelle): libelle is string => Boolean(libelle))
    : [];

  return (
    <tr className="hover:bg-gray-50 align-top">
      <td className="px-4 py-3">
        <div className="text-xs text-gray-400 font-mono mb-1">{maintenance.numero}</div>
        <div className="flex flex-wrap items-center gap-1">
          {maintenance.categories.map((categorie, idx) => (
            <span key={categorie} className="inline-flex items-center gap-1">
              {idx > 0 && <span className="text-gray-400 text-xs">+</span>}
              <CategorieMaintenanceBadge categorie={categorie} />
            </span>
          ))}
        </div>
        {libellesAutre.length > 0 && <div className="mt-1 text-xs text-gray-500">Autre : {libellesAutre.join(', ')}</div>}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {ascenseur ? (
          <Link href={`/parc/${ascenseur.id}`} className="text-blue-600 hover:underline font-medium">
            {ascenseur.code}
          </Link>
        ) : (
          '—'
        )}
        {ascenseur && <div className="text-xs text-gray-500">{ascenseur.ville}</div>}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-gray-900">Prévue : {formatDate(new Date(maintenance.datePrevue))}</div>
        <div className="text-gray-500">Réalisée : {maintenance.dateRealisee ? formatDate(new Date(maintenance.dateRealisee)) : '—'}</div>
        {maintenance.retardJours > 0 && (
          <div className="mt-1 inline-flex items-center gap-1 text-rose-600 text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            En retard de {maintenance.retardJours} jour{maintenance.retardJours > 1 ? 's' : ''}
          </div>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <StatutMaintenanceBadge statut={maintenance.statut} />
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-xs">
        {STATUTS_AVEC_DUREE.includes(maintenance.statut) ? (
          <div className="space-y-0.5">
            {maintenance.heureArrivee && <div className="text-gray-700">Arrivée : {formatDate(new Date(maintenance.heureArrivee))}</div>}
            {maintenance.heureDebut && <div className="text-gray-700">Début : {formatDate(new Date(maintenance.heureDebut))}</div>}
            {maintenance.statut === StatutMaintenance.EN_COURS_DE_REALISATION && maintenance.dureeEnCoursMinutes !== undefined && (
              <div className="text-gray-700">En cours depuis {maintenance.dureeEnCoursMinutes} min</div>
            )}
            {maintenance.statut === StatutMaintenance.REALISEE && maintenance.dureeReelleMinutes !== undefined && (
              <div className="text-gray-700">Durée réelle : {maintenance.dureeReelleMinutes} min</div>
            )}
            <div className="text-gray-500">Seuil contractuel : {maintenance.seuilDureeMinimaleMinutes} min</div>
            {maintenance.avertissementDureeInsuffisante && (
              <div className="inline-flex items-center gap-1 text-rose-600 font-medium">
                <AlertTriangle className="h-3 w-3" /> Durée insuffisante
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
        <div>{technicien?.nomComplet ?? '—'}</div>
        {tournee && <div className="text-gray-500">{tournee.nom}</div>}
      </td>
    </tr>
  );
}
