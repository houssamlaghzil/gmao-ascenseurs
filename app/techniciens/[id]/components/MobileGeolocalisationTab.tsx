/**
 * Onglet Mobile & géolocalisation de la fiche technicien (section 12) :
 * session mobile en cours (SessionTechnicien), file de synchronisation
 * (ElementFileSynchronisation) et dernière position connue (section 13).
 *
 * PositionTechnicien est explicitement documentée dans domain/types.ts comme
 * "ACCÈS RESTREINT : réservée aux profils administratifs autorisés
 * (ADMINISTRATEUR/SUPERVISEUR)". Cette maquette n'implémente pas
 * d'authentification réelle : la restriction est donc uniquement rappelée
 * visuellement ici (bandeau), sans filtrage d'accès effectif.
 */

import { Lock, MapPin } from 'lucide-react';
import {
  ElementFileSynchronisation,
  EtatSynchronisationTechnicien,
  PositionTechnicien,
  SessionTechnicien,
} from '@/domain/types';
import Timeline from '@/components/Timeline';
import { EtatConnexionMobileBadge, StatutPresenceTechnicienBadge, StatutSessionTechnicienBadge, StatutSynchronisationBadge } from '@/components/StatusBadges';
import { formatDate, formatDistanceToNow } from '@/lib/utils';
import { LienVille } from '@/components/Liens';

interface MobileGeolocalisationTabProps {
  session?: SessionTechnicien;
  etatSynchronisation?: EtatSynchronisationTechnicien;
  elementsSynchronisation: ElementFileSynchronisation[];
  position?: PositionTechnicien;
  tourneeVille?: string;
}

export default function MobileGeolocalisationTab({
  session,
  etatSynchronisation,
  elementsSynchronisation,
  position,
  tourneeVille,
}: MobileGeolocalisationTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Session mobile</h2>
          {!session ? (
            <p className="text-sm text-gray-500">Ce technicien n&apos;a jamais ouvert de session sur l&apos;application mobile.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">Statut</dt>
                <dd>
                  <StatutSessionTechnicienBadge statut={session.statut} />
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">Connexion</dt>
                <dd>
                  <EtatConnexionMobileBadge etat={session.etatConnexion} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Début de journée</dt>
                <dd className="text-gray-900">{formatDate(new Date(session.dateDebut))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Dernière synchro. réussie</dt>
                <dd className="text-gray-900">
                  {session.derniereSynchronisationReussie ? formatDistanceToNow(new Date(session.derniereSynchronisationReussie)) : 'Jamais'}
                </dd>
              </div>
              {etatSynchronisation && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Éléments en attente</dt>
                    <dd className={etatSynchronisation.nombreElementsEnAttente > 0 ? 'font-semibold text-amber-600' : 'text-gray-400'}>
                      {etatSynchronisation.nombreElementsEnAttente}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Éléments en échec</dt>
                    <dd className={etatSynchronisation.nombreElementsEnEchec > 0 ? 'font-semibold text-rose-600' : 'text-gray-400'}>
                      {etatSynchronisation.nombreElementsEnEchec}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" /> Géolocalisation
          </h2>
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Réservé aux profils administratifs autorisés (Administrateur / Superviseur) — section 13 du cahier des charges.</span>
          </div>
          {!position ? (
            <p className="text-sm text-gray-500">Aucune position connue pour ce technicien.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">Présence</dt>
                <dd>
                  <StatutPresenceTechnicienBadge statut={position.statutPresence} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Coordonnées</dt>
                <dd className="text-gray-900 font-mono text-xs">
                  {position.coordonnees.latitude.toFixed(4)}, {position.coordonnees.longitude.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ville approx.</dt>
                <dd className="text-gray-900">
                  {tourneeVille ? <LienVille id={tourneeVille}>{tourneeVille}</LienVille> : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Dernier ping</dt>
                <dd className="text-gray-900">{formatDistanceToNow(new Date(position.horodatage))}</dd>
              </div>
              {position.precisionMetres != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Précision</dt>
                  <dd className="text-gray-900">± {position.precisionMetres} m</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">File de synchronisation</h2>
        <Timeline
          items={elementsSynchronisation.map((e) => ({
            id: e.id,
            dateHeure: e.horodatageEvenement,
            badge: <StatutSynchronisationBadge statut={e.statut} />,
            description: e.messageErreur ? `${e.libelleAffichage} — ${e.messageErreur}` : e.libelleAffichage,
          }))}
          emptyLabel="Aucun élément dans la file de synchronisation."
        />
      </div>
    </div>
  );
}
