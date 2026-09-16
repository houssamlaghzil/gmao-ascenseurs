/**
 * Diagnostic progressif (section 26) : Origine → Étage → Local → Équipement
 * → État → Action, chaque sélection ne révélant que les choix suivants
 * pertinents (référentiels en cascade de data/store.ts, résolus ici puis
 * filtrés côté client selon la sélection en cours). Suite de
 * app/mobile/interventions/[id]/demarrage (étapes 1-2, sections 24/25) ;
 * une fois le diagnostic validé, redirige vers .../cloture (section 27,
 * construit par un autre agent).
 */

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { EtatConnexionMobile, StatutIntervention } from '@/domain/types';
import {
  getActionsDiagnosticReferentiel,
  getAllTechniciens,
  getAscenseurById,
  getEquipementsReferentiel,
  getEtatsEquipementReferentiel,
  getInterventionById,
  getSessionActiveDuTechnicien,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import DiagnosticWizard from './DiagnosticWizard';

export default function DiagnosticInterventionPage({ params }: { params: { id: string } }) {
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
          detail="Le refus d'accès a déjà été enregistré pour cette intervention : il n'y a pas de diagnostic à réaliser."
        />
      </div>
    );
  }

  if (intervention.statut !== StatutIntervention.EN_COURS) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <BandeauConnexion etat={etatConnexion} />
        <MessageBlocage
          titre="Diagnostic non disponible"
          detail="L'accès et l'état initial de l'appareil doivent d'abord être renseignés."
          lienHref={`/mobile/interventions/${intervention.id}/demarrage`}
          lienLabel="Aller au démarrage de l'intervention"
        />
      </div>
    );
  }

  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const niveaux = [...(ascenseur?.ficheTechnique.niveauxDesservis ?? [])]
    .sort((a, b) => a.ordre - b.ordre)
    .map((n) => ({ code: n.code, libelle: n.libelle }));
  const equipements = getEquipementsReferentiel()
    .filter((e) => e.actif)
    .sort((a, b) => a.ordreAffichage - b.ordreAffichage);
  const etats = getEtatsEquipementReferentiel()
    .filter((e) => e.actif)
    .sort((a, b) => a.ordreAffichage - b.ordreAffichage);
  const diagnosticActions = getActionsDiagnosticReferentiel()
    .filter((a) => a.actif)
    .sort((a, b) => a.ordreAffichage - b.ordreAffichage);
  const techniciensDisponibles = getAllTechniciens()
    .filter((t) => t.actif && t.id !== technicien.id)
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))
    .map((t) => ({ id: t.id, nomComplet: t.nomComplet }));

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <p className="text-xs text-gray-500">{ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : 'Appareil inconnu'}</p>
        <h1 className="text-lg font-semibold text-gray-900">{LIBELLE_MOTIF_INTERVENTION[intervention.motif]}</h1>
      </div>

      <DiagnosticWizard
        interventionId={intervention.id}
        niveaux={niveaux}
        equipements={equipements}
        etats={etats}
        actions={diagnosticActions}
        techniciensDisponibles={techniciensDisponibles}
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
