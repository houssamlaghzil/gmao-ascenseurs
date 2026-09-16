/**
 * Plan schématique en SVG/CSS (section 13) — pas de tuiles réseau, pas de
 * clé API : Leaflet/Mapbox/Google Maps ne sont pas installés dans ce projet.
 * Toutes les positions (appareils, techniciens, contours de zone, étapes de
 * tournée) arrivent déjà projetées en pourcentages (0-100, voir
 * lib/derived/carte.ts) : les pins sont des éléments HTML positionnés en
 * `left`/`top`, les zones et les tracés de tournée un unique calque SVG
 * (`viewBox="0 0 100 100"`, non proportionnel) partageant le même repère.
 * Composant Server Component : le survol (tooltip) est fait en CSS pur
 * (`group-hover`), aucune interactivité ne nécessite de JS côté client.
 */

import Link from 'next/link';
import { User } from 'lucide-react';
import { StatutAppareil, StatutPresenceTechnicien, TypeZoneGeographique } from '@/domain/types';
import { LIBELLE_STATUT_APPAREIL } from '@/lib/derived/libelles-parc';
import type { PointCarteAppareil, PointCarteTechnicien, ZoneCarte, TourneeDuJourCarte } from '@/lib/derived/carte';
import StatusBadge from '@/components/StatusBadge';
import { formatDistanceToNow } from '@/lib/utils';

const COULEUR_STATUT: Record<StatutAppareil, string> = {
  [StatutAppareil.EN_SERVICE]: '#10b981',
  [StatutAppareil.EN_PANNE]: '#f43f5e',
  [StatutAppareil.A_L_ARRET]: '#f97316',
  [StatutAppareil.MODE_DEGRADE]: '#f59e0b',
  [StatutAppareil.ARRET_TRAVAUX]: '#64748b',
};

const COULEUR_PRESENCE: Record<StatutPresenceTechnicien, string> = {
  [StatutPresenceTechnicien.EN_LIGNE]: '#2563eb',
  [StatutPresenceTechnicien.EN_PAUSE]: '#f59e0b',
  [StatutPresenceTechnicien.HORS_LIGNE]: '#9ca3af',
};

const LIBELLE_PRESENCE: Record<StatutPresenceTechnicien, string> = {
  [StatutPresenceTechnicien.EN_LIGNE]: 'En ligne',
  [StatutPresenceTechnicien.EN_PAUSE]: 'En pause',
  [StatutPresenceTechnicien.HORS_LIGNE]: 'Hors ligne',
};

interface CarteSchematiqueProps {
  points: PointCarteAppareil[];
  techniciens: PointCarteTechnicien[];
  zones: ZoneCarte[];
  tournees: TourneeDuJourCarte[];
}

export default function CarteSchematique({ points, techniciens, zones, tournees }: CarteSchematiqueProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div
        className="relative w-full aspect-[16/10] rounded-md border border-gray-200 overflow-hidden"
        style={{
          backgroundColor: '#eef2f7',
          backgroundImage:
            'linear-gradient(#dbe3ee 1px, transparent 1px), linear-gradient(90deg, #dbe3ee 1px, transparent 1px)',
          backgroundSize: '5% 6.66%',
        }}
      >
        {/* Fond stylisé : zones/secteurs (polygones semi-transparents) + tracés des tournées du jour */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {zones.map((zone) => (
            <polygon
              key={zone.id}
              points={zone.contour.map((p) => `${p.xPercent},${p.yPercent}`).join(' ')}
              fill={zone.couleur}
              fillOpacity={zone.type === TypeZoneGeographique.ZONE_COMMERCIALE ? 0.08 : 0.14}
              stroke={zone.couleur}
              strokeOpacity={0.45}
              strokeWidth={0.15}
            >
              <title>{zone.nom}</title>
            </polygon>
          ))}
          {tournees.map((tournee) => (
            <polyline
              key={tournee.id}
              points={tournee.etapes.map((e) => `${e.xPercent},${e.yPercent}`).join(' ')}
              fill="none"
              stroke={tournee.couleur}
              strokeWidth={0.25}
              strokeDasharray="1.2 0.8"
              strokeOpacity={0.75}
              strokeLinecap="round"
            >
              <title>{`Tournée ${tournee.technicienNom}`}</title>
            </polyline>
          ))}
        </svg>

        {/* Pins appareils */}
        {points.map((point) => (
          <Link
            key={point.appareilId}
            href={`/parc/${point.appareilId}`}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.position.xPercent}%`, top: `${point.position.yPercent}%` }}
          >
            {point.interventionUrgenteId ? (
              <span className="relative flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: COULEUR_STATUT[point.statut] }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: COULEUR_STATUT[point.statut] }}
                />
              </span>
            ) : (
              <span
                className="block h-2.5 w-2.5 rounded-full shadow ring-2 ring-white"
                style={{ backgroundColor: COULEUR_STATUT[point.statut] }}
              />
            )}
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              <span className="font-medium">{point.code}</span> · {point.ville} · {LIBELLE_STATUT_APPAREIL[point.statut]}
              {point.interventionUrgenteId && <span className="text-rose-600"> · Intervention urgente</span>}
            </span>
          </Link>
        ))}

        {/* Pins techniciens (position temps réel — accès restreint, voir FiltresCarteForm) */}
        {techniciens.map((technicien) => (
          <div
            key={technicien.technicienId}
            className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${technicien.position.xPercent}%`, top: `${technicien.position.yPercent}%` }}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow"
              style={{ backgroundColor: COULEUR_PRESENCE[technicien.statutPresence] }}
            >
              <User className="h-2.5 w-2.5 text-white" />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              <span className="font-medium">{technicien.nomComplet}</span> · {LIBELLE_PRESENCE[technicien.statutPresence]} · {formatDistanceToNow(new Date(technicien.horodatage))}
            </span>
          </div>
        ))}

        {points.length === 0 && techniciens.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Aucun point à afficher pour ces filtres.
          </div>
        )}
      </div>

      <Legende />
    </div>
  );
}

function Legende() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
      <span className="font-medium text-gray-500">Appareil :</span>
      {Object.values(StatutAppareil).map((statut) => (
        <StatusBadge key={statut} statut={statut} />
      ))}

      <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" />
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
        </span>
        Intervention urgente ouverte
      </span>

      <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" />
      <span className="font-medium text-gray-500">Technicien :</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COULEUR_PRESENCE[StatutPresenceTechnicien.EN_LIGNE] }} />
        En ligne
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COULEUR_PRESENCE[StatutPresenceTechnicien.EN_PAUSE] }} />
        En pause
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COULEUR_PRESENCE[StatutPresenceTechnicien.HORS_LIGNE] }} />
        Hors ligne
      </span>

      <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" />
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border border-blue-500 bg-blue-500/20" />
        Zone / secteur
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-blue-500" />
        Tournée du jour
      </span>
    </div>
  );
}
