/**
 * Démarrage d'intervention — accès à l'appareil (section 24) et état initial
 * constaté (section 25). Server Component : lecture seule (jointures
 * intervention/appareil/technicien), l'enchaînement des étapes et les
 * validations vivent dans DemarrageWizard ('use client' + Server Actions).
 *
 * Garde métier : demarrerIntervention (domain/business-logic.ts) n'autorise
 * cette étape que depuis StatutIntervention.PRIS_EN_CHARGE. Si l'intervention
 * a déjà démarré (EN_COURS, accès obtenu), on renvoie directement vers le
 * diagnostic pour permettre de reprendre le parcours plutôt que de rejouer
 * l'étape d'accès ; dans tout autre statut, un message explique pourquoi le
 * démarrage n'est pas disponible plutôt que de laisser la Server Action
 * échouer sur la garde métier.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { EtatConnexionMobile, StatutIntervention } from '@/domain/types';
import {
  getAllPhotosRapport,
  getAllTechniciens,
  getAscenseurById,
  getInterventionById,
  getSessionActiveDuTechnicien,
} from '@/data/store';
import { getTechnicienConnecte } from '@/lib/mobile-session';
import BandeauConnexion from '@/app/mobile/components/BandeauConnexion';
import { LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import { LIBELLE_STATUT_INTERVENTION } from '@/lib/derived/libelles-interventions';
import DemarrageWizard from './DemarrageWizard';

const TAILLE_POOL_PHOTOS = 12;

export default function DemarrageInterventionPage({ params }: { params: { id: string } }) {
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

  // Diagnostic déjà démarré (accès obtenu) : on reprend directement là où le
  // technicien en était plutôt que de rejouer l'étape d'accès.
  if (intervention.statut === StatutIntervention.EN_COURS && !intervention.accesRefuse) {
    redirect(`/mobile/interventions/${intervention.id}/diagnostic`);
  }

  const ascenseur = getAscenseurById(intervention.ascenseurId);
  const techniciensDisponibles = getAllTechniciens()
    .filter((t) => t.actif && t.id !== technicien.id)
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))
    .map((t) => ({ id: t.id, nomComplet: t.nomComplet }));

  // Pool mutualisé de photos (même principe que côté web, voir
  // app/rapports/[id]/components/PhotosRapport.tsx) : URLs distinctes déjà
  // utilisées par des rapports existants, jamais une image unique par saisie.
  const poolPhotos = Array.from(new Set(getAllPhotosRapport().map((p) => p.url))).slice(0, TAILLE_POOL_PHOTOS);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pb-2 pt-4">
        <p className="text-xs text-gray-500">{ascenseur ? `${ascenseur.code} — ${ascenseur.ville}` : 'Appareil inconnu'}</p>
        <h1 className="text-lg font-semibold text-gray-900">{LIBELLE_MOTIF_INTERVENTION[intervention.motif]}</h1>
      </div>

      {intervention.statut !== StatutIntervention.PRIS_EN_CHARGE ? (
        <MessageBlocage
          titre="Démarrage non disponible"
          detail={`Cette intervention est au statut « ${LIBELLE_STATUT_INTERVENTION[intervention.statut]} » : le démarrage terrain n'est possible que depuis « Pris en charge ».`}
        />
      ) : (
        <DemarrageWizard interventionId={intervention.id} techniciensDisponibles={techniciensDisponibles} poolPhotos={poolPhotos} />
      )}
    </div>
  );
}

function MessageBlocage({ titre, detail }: { titre: string; detail?: string }) {
  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-medium text-amber-800">{titre}</p>
        {detail && <p className="mt-1 text-xs text-amber-700">{detail}</p>}
        <Link href="/mobile/accueil" className="mt-3 inline-block text-xs font-medium text-amber-800 underline underline-offset-2">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
