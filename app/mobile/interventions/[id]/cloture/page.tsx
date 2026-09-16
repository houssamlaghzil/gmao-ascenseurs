/**
 * Clôture d'intervention (sections 27-30) : suite de
 * app/mobile/interventions/[id]/diagnostic (construit par un autre agent),
 * mais accessible aussi en lien profond pour test — la garde métier
 * (terminerIntervention, domain/business-logic.ts) n'accepte de toute façon
 * que le statut EN_COURS. Si un Rapport BROUILLON existe déjà pour cette
 * intervention (créé par l'étape diagnostic), il est complété ici plutôt que
 * dupliqué ; sinon un Rapport complet est créé directement (voir
 * ./actions.ts).
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { EtatConnexionMobile, StatutIntervention, StatutSynchronisation, TypeRapport } from '@/domain/types';
import {
  getAllPhotosRapport,
  getAscenseurById,
  getEtatsEquipementReferentiel,
  getInterventionById,
  getRapportsByInterventionId,
  getReglesObligationPhotos,
  getSessionActiveDuTechnicien,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_STATUT_INTERVENTION } from '@/lib/derived/libelles-interventions';
import ClotureWizard from './ClotureWizard';

const TAILLE_POOL_PHOTOS = 12;

const STATUTS_EN_AMONT: StatutIntervention[] = [
  StatutIntervention.NOUVEAU,
  StatutIntervention.A_AFFECTER,
  StatutIntervention.AFFECTE,
  StatutIntervention.PRIS_EN_CHARGE,
];

export default function ClotureInterventionPage({ params }: { params: { id: string } }) {
  const intervention = getInterventionById(params.id);
  const technicien = getTechnicienConnecte();
  const etatConnexion = getSessionActiveDuTechnicien(technicien.id)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  if (!intervention) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage titre="Intervention introuvable" />
      </div>
    );
  }

  if (intervention.accesRefuse) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage
          titre="Accès non obtenu"
          detail="Le refus d'accès a déjà été enregistré et le rapport terminé pour cette intervention : il n'y a pas de clôture normale à réaliser."
        />
      </div>
    );
  }

  if (intervention.statut !== StatutIntervention.EN_COURS) {
    const enAmont = STATUTS_EN_AMONT.includes(intervention.statut);
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage
          titre="Clôture non disponible"
          detail={`Cette intervention est au statut « ${LIBELLE_STATUT_INTERVENTION[intervention.statut]} » : la clôture n'est possible que depuis « En cours ».`}
          lienHref={enAmont ? `/mobile/interventions/${intervention.id}/demarrage` : '/mobile/accueil'}
          lienLabel={enAmont ? "Aller au démarrage de l'intervention" : "Retour à l'accueil"}
        />
      </div>
    );
  }

  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const niveaux = [...(ascenseur?.ficheTechnique.niveauxDesservis ?? [])]
    .sort((a, b) => a.ordre - b.ordre)
    .map((n) => ({ code: n.code, libelle: n.libelle }));

  const rapportsExistants = getRapportsByInterventionId(intervention.id);
  const brouillon = rapportsExistants.find((r) => r.statutSynchronisation === StatutSynchronisation.BROUILLON);

  const etatDiagnostic = brouillon?.diagnostic?.etatConstateId
    ? getEtatsEquipementReferentiel().find((e) => e.id === brouillon.diagnostic!.etatConstateId)
    : undefined;
  const pieceCasseeSignalee = etatDiagnostic?.indiquePieceCassee ?? false;

  const regle = getReglesObligationPhotos().find((r) => r.typeRapport === TypeRapport.DEPANNAGE);

  // Pool mutualisé de photos (même principe que côté web, voir
  // app/rapports/[id]/components/PhotosRapport.tsx) : URLs distinctes déjà
  // utilisées par des rapports existants, jamais une image unique par saisie.
  const poolPhotos = Array.from(new Set(getAllPhotosRapport().map((p) => p.url))).slice(0, TAILLE_POOL_PHOTOS);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <p className="text-xs text-gray-500">{ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : 'Appareil inconnu'}</p>
        <h1 className="text-lg font-semibold text-gray-900">Clôture — {LIBELLE_MOTIF_INTERVENTION[intervention.motif]}</h1>
      </div>

      <ClotureWizard
        interventionId={intervention.id}
        technicienNom={technicien.nomComplet}
        niveaux={niveaux}
        poolPhotos={poolPhotos}
        regle={regle}
        pieceCasseeSignalee={pieceCasseeSignalee}
        etatConnexion={etatConnexion}
      />
    </div>
  );
}

function MessageBlocage({
  titre,
  detail,
  lienHref = '/mobile/accueil',
  lienLabel = "Retour à l'accueil",
}: {
  titre: string;
  detail?: string;
  lienHref?: string;
  lienLabel?: string;
}) {
  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-medium text-amber-800">{titre}</p>
        {detail && <p className="mt-1 text-xs text-amber-700">{detail}</p>}
        <Link href={lienHref} className="mt-3 inline-block text-xs font-medium text-amber-800 underline underline-offset-2">
          {lienLabel}
        </Link>
      </div>
    </div>
  );
}
