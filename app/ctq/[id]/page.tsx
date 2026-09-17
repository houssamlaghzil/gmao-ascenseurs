/**
 * Détail d'un contrôle CTQ (section 10.2) — Server Component : toutes les
 * jointures (appareil, client, bureau d'études, technicien, réserves,
 * photos, traitement) sont faites ici, une seule fois, puis transmises aux
 * blocs de la page. Même convention que app/interventions/[id]/page.tsx.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { TypeTraitementReserve } from '@/domain/types';
import {
  getAscenseurById,
  getBureauEtudesById,
  getClientById,
  getControleCTQById,
  getInterventionById,
  getMaintenanceById,
  getPhotosByReserveId,
  getReservesCTQByControleId,
  getTechnicienById,
} from '@/data/store';
import { calculerStatutControle } from '@/domain/business-logic';
import InformationsControle from './components/InformationsControle';
import BlocsControle, { type DetailReservePoint } from './components/BlocsControle';

interface CtqDetailPageProps {
  params: { id: string };
}

export default function CtqDetailPage({ params }: CtqDetailPageProps) {
  const controle = getControleCTQById(params.id);
  if (!controle) notFound();

  const ascenseur = getAscenseurById(controle.appareilId);
  const client = getClientById(controle.clientId);
  const bureauEtudes = getBureauEtudesById(controle.bureauEtudesId);
  const technicien = controle.technicienId ? getTechnicienById(controle.technicienId) : undefined;

  const reserves = getReservesCTQByControleId(controle.id);
  const statutRecalcule = calculerStatutControle(controle, reserves);

  const detailsParPointId = new Map<string, DetailReservePoint>();
  for (const reserve of reserves) {
    let traitementReference: string | undefined;
    let traitementHref: string | undefined;
    if (reserve.traitement) {
      if (reserve.traitement.type === TypeTraitementReserve.INTERVENTION) {
        const intervention = getInterventionById(reserve.traitement.id);
        traitementReference = intervention?.numero ?? reserve.traitement.id;
        traitementHref = intervention ? `/interventions/${intervention.id}` : undefined;
      } else {
        const maintenance = getMaintenanceById(reserve.traitement.id);
        traitementReference = maintenance?.numero ?? reserve.traitement.id;
      }
    }

    detailsParPointId.set(reserve.pointDeControleId, {
      reserve,
      photos: getPhotosByReserveId(reserve.id),
      technicienId: reserve.technicienAssigneId,
      technicienNom: reserve.technicienAssigneId ? getTechnicienById(reserve.technicienAssigneId)?.nomComplet : undefined,
      traitementReference,
      traitementHref,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ctq" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux contrôles CTQ
        </Link>
      </div>

      <InformationsControle
        controle={controle}
        ascenseur={ascenseur}
        client={client}
        bureauEtudes={bureauEtudes}
        technicien={technicien}
        statutRecalcule={statutRecalcule}
      />

      <BlocsControle blocs={controle.blocs} detailsParPointId={detailsParPointId} />
    </div>
  );
}
