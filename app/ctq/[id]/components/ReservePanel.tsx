/**
 * Détail d'une réserve CTQ (section 10.2), affiché sous son point de
 * contrôle NON_CONFORME : action demandée, gravité/statut, dates du cycle
 * de vie, technicien assigné, traitement (intervention/maintenance),
 * commentaires et photos (getPhotosByReserveId).
 */

import Link from 'next/link';
import { AlertTriangle, Camera } from 'lucide-react';
import { PhotoRapport, ReserveCTQ } from '@/domain/types';
import { estReserveEnRetard } from '@/domain/business-logic';
import { GraviteReserveBadge, StatutReserveBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { LIBELLE_TYPE_TRAITEMENT_RESERVE } from '@/lib/derived/libelles-ctq';

interface ReservePanelProps {
  reserve: ReserveCTQ;
  photos: PhotoRapport[];
  technicienNom?: string;
  traitementReference?: string;
  traitementHref?: string;
}

function LigneInfo({ label, valeur }: { label: string; valeur?: string }) {
  if (!valeur) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{valeur}</dd>
    </div>
  );
}

export default function ReservePanel({ reserve, photos, technicienNom, traitementReference, traitementHref }: ReservePanelProps) {
  const enRetard = estReserveEnRetard(reserve);

  return (
    <div id={`reserve-${reserve.id}`} className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4 scroll-mt-20">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{reserve.numero}</span>
          <GraviteReserveBadge gravite={reserve.gravite} />
          <StatutReserveBadge statut={reserve.statut} />
        </div>
        {enRetard && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Échéance dépassée
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mt-3">{reserve.description}</p>

      <div className="mt-3 rounded-md bg-white border border-gray-200 p-3">
        <dt className="text-xs font-medium text-gray-500 uppercase">Action demandée</dt>
        <dd className="text-sm text-gray-900 mt-0.5">{reserve.actionDemandee}</dd>
      </div>

      <dl className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <LigneInfo label="Localisation" valeur={reserve.localisation} />
        <LigneInfo label="Constatée le" valeur={formatDate(new Date(reserve.dateConstat))} />
        <LigneInfo label="Échéance" valeur={reserve.dateEcheance ? formatDate(new Date(reserve.dateEcheance)) : undefined} />
        <LigneInfo label="Technicien assigné" valeur={technicienNom} />
        <LigneInfo label="Planifiée le" valeur={reserve.datePlanification ? formatDate(new Date(reserve.datePlanification)) : undefined} />
        <LigneInfo label="Traitée le" valeur={reserve.dateTraitement ? formatDate(new Date(reserve.dateTraitement)) : undefined} />
        <LigneInfo label="Validée le" valeur={reserve.dateValidation ? formatDate(new Date(reserve.dateValidation)) : undefined} />
        <LigneInfo label="Validée par" valeur={reserve.validePar} />
      </dl>

      {reserve.traitement && (
        <div className="mt-3">
          <dt className="text-xs font-medium text-gray-500 uppercase">Traitement</dt>
          <dd className="text-sm text-gray-900 mt-0.5">
            {LIBELLE_TYPE_TRAITEMENT_RESERVE[reserve.traitement.type]}
            {traitementReference && traitementHref ? (
              <>
                {' — '}
                <Link href={traitementHref} className="text-blue-600 hover:underline">
                  {traitementReference}
                </Link>
              </>
            ) : traitementReference ? (
              ` — ${traitementReference}`
            ) : null}
          </dd>
        </div>
      )}

      {reserve.commentaireTechnicien && (
        <div className="mt-3">
          <dt className="text-xs font-medium text-gray-500 uppercase">Commentaire technicien</dt>
          <dd className="text-sm text-gray-700 mt-0.5 italic">« {reserve.commentaireTechnicien} »</dd>
        </div>
      )}

      {reserve.commentaireValidation && (
        <div className="mt-3">
          <dt className="text-xs font-medium text-gray-500 uppercase">Commentaire de validation</dt>
          <dd className="text-sm text-gray-700 mt-0.5 italic">« {reserve.commentaireValidation} »</dd>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
          <Camera className="h-3.5 w-3.5" /> Photos
        </p>
        {photos.length > 0 ? (
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {photos.map((photo) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block group">
                {/* eslint-disable-next-line @next/next/no-img-element -- vraies URLs picsum.photos, next/image nécessiterait une config remotePatterns hors périmètre */}
                <img
                  src={photo.url}
                  alt={photo.legende ?? `Photo ${reserve.numero}`}
                  className="w-full h-20 object-cover rounded-md border border-gray-200 group-hover:opacity-80"
                />
                <p className="text-[11px] text-gray-500 mt-1 truncate">{formatDate(new Date(photo.dateHeure))}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-400 italic">Aucune photo enregistrée pour cette réserve.</p>
        )}
      </div>
    </div>
  );
}
