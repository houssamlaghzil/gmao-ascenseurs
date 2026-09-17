/**
 * Blocs réglementaires d'un contrôle CTQ (section 10.2) : pour chaque bloc,
 * ses points de contrôle avec leur état, et le détail de la réserve associée
 * pour tout point NON_CONFORME.
 */

import { BlocControle, PhotoRapport, PointDeControle, ReserveCTQ } from '@/domain/types';
import { EtatPointControleBadge } from '@/components/StatusBadges';
import { LIBELLE_CATEGORIE_BLOC_CONTROLE } from '@/lib/derived/libelles-ctq';
import ReservePanel from './ReservePanel';

/** Contexte d'affichage d'une réserve, résolu une fois côté page (jointures technicien/traitement/photos). */
export interface DetailReservePoint {
  reserve: ReserveCTQ;
  photos: PhotoRapport[];
  technicienId?: string;
  technicienNom?: string;
  traitementReference?: string;
  traitementHref?: string;
}

interface BlocsControleProps {
  blocs: BlocControle[];
  detailsParPointId: Map<string, DetailReservePoint>;
}

export default function BlocsControle({ blocs, detailsParPointId }: BlocsControleProps) {
  const blocsTries = [...blocs].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="space-y-4">
      {blocsTries.map((bloc) => (
        <div key={bloc.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">{LIBELLE_CATEGORIE_BLOC_CONTROLE[bloc.categorie]}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {bloc.points.map((point) => (
              <PointRow key={point.id} point={point} detail={point.reserveId ? detailsParPointId.get(point.id) : undefined} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PointRow({ point, detail }: { point: PointDeControle; detail?: DetailReservePoint }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-900">{point.libelle}</p>
          {point.reference && <p className="text-xs text-gray-400">Réf. {point.reference}</p>}
          {point.commentaireControleur && <p className="text-xs text-gray-500 mt-1 italic">« {point.commentaireControleur} »</p>}
        </div>
        <EtatPointControleBadge etat={point.etat} />
      </div>

      {point.reserveId && (
        detail ? (
          <ReservePanel
            reserve={detail.reserve}
            photos={detail.photos}
            technicienId={detail.technicienId}
            technicienNom={detail.technicienNom}
            traitementReference={detail.traitementReference}
            traitementHref={detail.traitementHref}
          />
        ) : (
          <p className="mt-3 text-xs text-rose-600 italic">Réserve associée introuvable (id {point.reserveId}).</p>
        )
      )}
    </div>
  );
}
