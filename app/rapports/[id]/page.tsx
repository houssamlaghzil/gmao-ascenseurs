/**
 * Détail d'un rapport (section 9.2) — Server Component : toutes les
 * jointures sont faites ici, une seule fois, puis transmises aux blocs de
 * la page. Même convention que app/interventions/[id]/page.tsx.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import {
  getAscenseurById,
  getClientById,
  getInterventionById,
  getMaintenanceById,
  getPhotosByRapportId,
  getRapportById,
} from '@/data/store';
import { LIBELLE_ORIGINE_ACTION, LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { LIBELLE_RATTACHEMENT_RAPPORT } from '@/lib/derived/libelles-rapports';
import { StatutValidationRapportBadge } from '@/components/StatusBadges';
import { formatDate } from '@/lib/utils';
import { RattachementRapport, StatutValidationRapport } from '@/domain/types';
import DiagnosticRapport from './components/DiagnosticRapport';
import EtatEtClotureRapport from './components/EtatEtClotureRapport';
import PhotosRapport from './components/PhotosRapport';
import SignaturesRapport from './components/SignaturesRapport';

export const dynamic = 'force-dynamic';

interface RapportDetailPageProps {
  params: { id: string };
}

export default function RapportDetailPage({ params }: RapportDetailPageProps) {
  const rapport = getRapportById(params.id);
  if (!rapport) notFound();

  const ascenseur = getAscenseurById(rapport.ascenseurId);
  const client = ascenseur ? getClientById(ascenseur.clientId) : undefined;
  const photos = getPhotosByRapportId(rapport.id);
  const intervention = rapport.interventionId ? getInterventionById(rapport.interventionId) : undefined;
  const maintenance = rapport.maintenanceId ? getMaintenanceById(rapport.maintenanceId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/rapports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux rapports
        </Link>
        <Link
          href={`/rapports/${rapport.id}/pdf`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FileText className="h-4 w-4" /> Aperçu PDF client
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{rapport.numero}</h1>
              <StatutValidationRapportBadge statut={rapport.statutValidation} />
            </div>
            {ascenseur && (
              <p className="text-sm text-gray-600 mt-1">
                {ascenseur.code} — {rapport.adresseAppareil}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-600 text-right">
            <p>{client?.raisonSociale ?? 'Client inconnu'}</p>
            <p className="text-gray-400">{rapport.technicienNom}</p>
          </div>
        </div>

        {rapport.statutValidation === StatutValidationRapport.REFUSE_A_CORRIGER && rapport.commentaireRefus && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-md p-3">
            <p className="text-sm text-rose-800">
              <span className="font-medium">Refusé — à corriger : </span>
              {rapport.commentaireRefus}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DiagnosticRapport accesObtenu={rapport.accesObtenu} refusAcces={rapport.refusAcces} diagnostic={rapport.diagnostic} />

          <EtatEtClotureRapport
            etatInitial={rapport.etatInitial}
            etatCloture={rapport.etatCloture}
            etagesModeDegrade={rapport.etagesModeDegrade}
            commentaireCloture={rapport.commentaireCloture}
            operationsMaintenance={rapport.operationsMaintenance}
            resultatTestTelealarme={rapport.resultatTestTelealarme}
          />

          {rapport.commentaire && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Compte-rendu</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{rapport.commentaire}</p>
              {rapport.commentaireSaisieVocale && (
                <p className="text-xs text-gray-400 mt-2">Commentaire saisi par dictée vocale</p>
              )}
            </div>
          )}

          <PhotosRapport photos={photos} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Informations</h2>
            <InfoLigne label="Type de rapport" valeur={LIBELLE_TYPE_RAPPORT[rapport.typeRapport]} />
            <InfoLigne label="Rattachement" valeur={LIBELLE_RATTACHEMENT_RAPPORT[rapport.rattachement]} />
            {rapport.rattachement === RattachementRapport.INTERVENTION && intervention && (
              <InfoLigne
                label="Intervention"
                valeur={
                  <Link href={`/interventions/${intervention.id}`} className="text-blue-600 hover:underline">
                    {intervention.numero}
                    {rapport.numeroPassageIntervention ? ` (passage n°${rapport.numeroPassageIntervention})` : ''}
                  </Link>
                }
              />
            )}
            {rapport.rattachement === RattachementRapport.MAINTENANCE && maintenance && (
              <InfoLigne label="Maintenance" valeur={maintenance.numero} />
            )}
            {rapport.rattachement === RattachementRapport.ISOLE && rapport.motifRapportIsole && (
              <InfoLigne label="Motif" valeur={rapport.motifRapportIsole} />
            )}
            <InfoLigne label="Origine de la saisie" valeur={LIBELLE_ORIGINE_ACTION[rapport.origineSaisie]} />
            <hr className="border-gray-100" />
            <InfoLigne label="Technicien" valeur={rapport.technicienNom} />
            <InfoLigne label="Début" valeur={formatDate(new Date(rapport.dateHeureDebut))} />
            <InfoLigne label="Fin" valeur={rapport.dateHeureFin ? formatDate(new Date(rapport.dateHeureFin)) : '—'} />
            <InfoLigne label="Durée" valeur={rapport.dureeMinutes != null ? `${rapport.dureeMinutes} min` : '—'} />
          </div>

          <SignaturesRapport
            signatureTechnicien={rapport.signatureTechnicien}
            signatureClient={rapport.signatureClient}
            technicienNom={rapport.technicienNom}
          />
        </div>
      </div>
    </div>
  );
}

function InfoLigne({ label, valeur }: { label: string; valeur: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{valeur}</span>
    </div>
  );
}
