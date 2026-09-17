/**
 * Signatures technicien et client (section 30) — la signature client est
 * toujours une décision explicite (signé/absent/indisponible), jamais un
 * champ vide (voir domain/types.ts, SignatureClient).
 */

import { PenLine } from 'lucide-react';
import { SignatureClient, SignatureTechnicien } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import { StatutSignatureClientBadge } from '@/components/StatusBadges';
import { LienTechnicien } from '@/components/Liens';

interface SignaturesRapportProps {
  signatureTechnicien?: SignatureTechnicien;
  signatureClient?: SignatureClient;
  technicienId: string;
  technicienNom: string;
}

export default function SignaturesRapport({ signatureTechnicien, signatureClient, technicienId, technicienNom }: SignaturesRapportProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Signatures</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-md p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Technicien</p>
          <p className="text-sm text-gray-900 mt-1">
            <LienTechnicien id={technicienId} ton="sobre">
              {technicienNom}
            </LienTechnicien>
          </p>
          {signatureTechnicien ? (
            <div className="mt-2 flex items-center gap-2 text-emerald-700 text-xs">
              <PenLine className="h-3.5 w-3.5" />
              Signé le {formatDate(new Date(signatureTechnicien.dateHeure))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Non signé</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Client</p>
            {signatureClient && <StatutSignatureClientBadge statut={signatureClient.statut} />}
          </div>
          {signatureClient ? (
            <>
              {signatureClient.nomSignataire && <p className="text-sm text-gray-900 mt-1">{signatureClient.nomSignataire}</p>}
              {signatureClient.motifAbsenceOuIndisponibilite && (
                <p className="text-xs text-gray-500 mt-1">{signatureClient.motifAbsenceOuIndisponibilite}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{formatDate(new Date(signatureClient.dateHeure))}</p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Aucune décision enregistrée</p>
          )}
        </div>
      </div>
    </div>
  );
}
