/**
 * Fiche appareil mobile (section 22) — informations essentielles + boutons
 * d'action rapide vers les autres parcours mobile (démarrage
 * d'intervention/maintenance, rapport isolé, réserves CTQ, sections
 * 24-33/38). Server Component : lecture directe du store. Le formulaire de
 * modification du digicode/de la gestion des clés (section 23) est isolé
 * dans un composant client dédié (ModifierAccesForm) pour ne garder ici que
 * de l'interactivité locale.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText, KeyRound, PlayCircle, ShieldCheck, Wrench } from 'lucide-react';
import { ReactNode } from 'react';
import { EtatConnexionMobile, StatutIntervention } from '@/domain/types';
import {
  getAscenseurById,
  getClientById,
  getInterventionsByAscenseurId,
  getMaintenancesByAscenseurId,
  getSessionActiveDuTechnicien,
} from '@/data/store';
import { getTechnicienConnecteId } from '@/lib/mobile-session';
import { trouverDerniereMaintenanceRealisee, trouverProchaineMaintenancePlanifiee } from '@/lib/derived/maintenances-appareil';
import { LIBELLE_DETENTEUR_CLES, LIBELLE_MOTIF_INTERVENTION } from '@/lib/derived/libelles-parc';
import BandeauConnexion from '../../components/BandeauConnexion';
import StatusBadge from '@/components/StatusBadge';
import StatutInterventionBadge from '@/components/StatutInterventionBadge';
import { formatDate } from '@/lib/utils';
import ModifierAccesForm from './components/ModifierAccesForm';

export const dynamic = 'force-dynamic';

interface FicheAppareilMobilePageProps {
  params: { id: string };
}

export default function FicheAppareilMobilePage({ params }: FicheAppareilMobilePageProps) {
  const ascenseur = getAscenseurById(params.id);
  if (!ascenseur) notFound();

  const technicienId = getTechnicienConnecteId();
  const etatConnexion = getSessionActiveDuTechnicien(technicienId)?.etatConnexion ?? EtatConnexionMobile.EN_LIGNE;

  const client = getClientById(ascenseur.clientId);
  const fiche = ascenseur.ficheTechnique;

  const interventionsOuvertes = getInterventionsByAscenseurId(ascenseur.id)
    .filter((i) => i.statut !== StatutIntervention.CLOTURE)
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  const interventionADemarrer = interventionsOuvertes.find((i) => i.technicienId === technicienId);

  const maintenances = getMaintenancesByAscenseurId(ascenseur.id);
  const derniereMaintenance = trouverDerniereMaintenanceRealisee(maintenances);
  const prochaineMaintenance = trouverProchaineMaintenancePlanifiee(maintenances);

  return (
    <div className="flex flex-col min-h-full">
      <BandeauConnexion etat={etatConnexion} />

      <div className="px-4 pt-4 pb-2">
        <Link href="/mobile/tournee" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-3.5 w-3.5" /> Ma tournée
        </Link>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-gray-900">{ascenseur.code}</h1>
          <StatusBadge statut={ascenseur.statutAppareil} />
        </div>
        {ascenseur.nom && <p className="text-xs text-gray-500 mt-0.5">{ascenseur.nom}</p>}
        <p className="text-sm text-gray-600 mt-1">
          {ascenseur.adresseComplete}, {ascenseur.ville}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{client?.raisonSociale ?? 'Client inconnu'}</p>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {interventionADemarrer ? (
          <BoutonAction
            href={`/mobile/interventions/${interventionADemarrer.id}/demarrage`}
            icon={<PlayCircle className="h-5 w-5" />}
            label="Démarrer une intervention"
            primary
          />
        ) : (
          <BoutonAction
            href={`/mobile/rapport-isole?appareilId=${ascenseur.id}`}
            icon={<FileText className="h-5 w-5" />}
            label="Créer un rapport isolé"
            primary
          />
        )}
        <BoutonAction href={`/mobile/maintenances?appareilId=${ascenseur.id}`} icon={<Wrench className="h-5 w-5" />} label="Démarrer une maintenance" />
        <BoutonAction href={`/mobile/rapport-isole?appareilId=${ascenseur.id}`} icon={<FileText className="h-5 w-5" />} label="Créer un rapport isolé" />
        <BoutonAction href={`/mobile/ctq?appareilId=${ascenseur.id}`} icon={<ShieldCheck className="h-5 w-5" />} label="Voir les réserves" />
      </div>

      <div className="px-4 pb-3">
        <Carte titre="Accès">
          <div className="flex items-start justify-between gap-2">
            <dl className="grid grid-cols-1 gap-2 flex-1 min-w-0">
              <Champ label="Digicode" value={fiche.digicode} />
              <Champ label="Gestion des clés" value={LIBELLE_DETENTEUR_CLES[fiche.gestionCles.detenteur]} />
              {fiche.gestionCles.localisation && <Champ label="Localisation des clés" value={fiche.gestionCles.localisation} />}
              {fiche.accesLocalTechnique.localisation && <Champ label="Local technique" value={fiche.accesLocalTechnique.localisation} />}
              {fiche.accesLocalTechnique.digicodeSpecifique && (
                <Champ label="Digicode local technique" value={fiche.accesLocalTechnique.digicodeSpecifique} />
              )}
            </dl>
            <KeyRound className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
          </div>
          <ModifierAccesForm
            ascenseurId={ascenseur.id}
            digicodeActuel={fiche.digicode}
            detenteurActuel={fiche.gestionCles.detenteur}
            localisationActuelle={fiche.gestionCles.localisation}
          />
        </Carte>
      </div>

      <div className="px-4 pb-3">
        <Carte titre="Caractéristiques techniques">
          <dl className="grid grid-cols-2 gap-2">
            <Champ label="Marque" value={fiche.marque} />
            <Champ label="Modèle" value={fiche.modele} />
            <Champ label="Charge utile" value={`${fiche.chargeUtileKg} kg`} />
            <Champ label="Vitesse" value={`${fiche.vitesseMs} m/s`} />
            <Champ label="Niveaux desservis" value={`${fiche.nombreNiveaux}`} />
          </dl>
        </Carte>
      </div>

      <div className="px-4 pb-3">
        <Carte titre="Maintenance">
          <dl className="grid grid-cols-1 gap-2">
            <Champ label="Dernière réalisée" value={derniereMaintenance?.dateRealisee ? formatDate(new Date(derniereMaintenance.dateRealisee)) : 'Aucune'} />
            <Champ
              label="Prochaine prévue"
              value={prochaineMaintenance ? formatDate(new Date(prochaineMaintenance.datePrevue)) : 'Aucune planifiée'}
            />
          </dl>
        </Carte>
      </div>

      <div className="px-4 pb-6">
        <Carte titre={`Interventions ouvertes (${interventionsOuvertes.length})`}>
          {interventionsOuvertes.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune intervention ouverte sur cet appareil.</p>
          ) : (
            <ul className="space-y-2">
              {interventionsOuvertes.map((i) => (
                <li key={i.id} className="border border-gray-100 rounded-md px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{LIBELLE_MOTIF_INTERVENTION[i.motif]}</span>
                    <StatutInterventionBadge statut={i.statut} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {i.numero} · {formatDate(new Date(i.dateCreation))}
                    {i.technicienId === technicienId ? ' · Vous' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </div>
  );
}

function Carte({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">{titre}</h2>
      {children}
    </div>
  );
}

function Champ({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[11px] text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

interface BoutonActionProps {
  href: string;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}

function BoutonAction({ href, icon, label, primary }: BoutonActionProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1.5 text-center rounded-lg border p-3 h-24 ${
        primary ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'
      }`}
    >
      {icon}
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}
