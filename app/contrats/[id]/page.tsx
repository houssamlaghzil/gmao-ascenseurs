/**
 * Détail d'un contrat (section 14) — Server Component : toutes les
 * jointures (client, appareils réels, SLA, responsables) sont faites ici.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Check, X } from 'lucide-react';
import {
  getAscenseursByContratId,
  getClientById,
  getContratById,
  getDefinitionsSLAParContrat,
  getResponsableById,
} from '@/data/store';
import { StatutContratBadge } from '@/components/StatusBadges';
import { LIBELLE_FREQUENCE_MAINTENANCE, LIBELLE_NIVEAU_SLA } from '@/lib/derived/libelles-contrats';
import { LIBELLE_NIVEAU_URGENCE } from '@/lib/derived/libelles-interventions';
import { LienClient, LienContrat } from '@/components/Liens';

interface ContratDetailPageProps {
  params: { id: string };
}

function formatDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function InclusionMaintenance({ label, incluse }: { label: string; incluse: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {incluse ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-gray-300" />}
      <span className={incluse ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

export default function ContratDetailPage({ params }: ContratDetailPageProps) {
  const contrat = getContratById(params.id);
  if (!contrat) notFound();

  const client = getClientById(contrat.clientId);
  const nombreAppareilsReel = getAscenseursByContratId(contrat.id).length;
  const ecartAppareils = nombreAppareilsReel !== contrat.nombreAppareilsCouverts;

  const definitionsContrat = getDefinitionsSLAParContrat(contrat.id);
  const definitionsAffichees = definitionsContrat.length > 0 ? definitionsContrat : getDefinitionsSLAParContrat(undefined);

  const responsables = contrat.responsablesClientIds
    .map((id) => getResponsableById(contrat.clientId, id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contrats" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour aux contrats
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contrat.numero}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {client ? (
                <LienClient id={client.id} ton="sobre">
                  {client.raisonSociale}
                </LienClient>
              ) : (
                'Client inconnu'
              )}
            </p>
          </div>
          <StatutContratBadge statut={contrat.statut} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Périmètre &amp; périodicité</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Champ label="Appareils couverts (déclaré)">
              {contrat.nombreAppareilsCouverts}
              {ecartAppareils && <span className="block text-xs text-amber-600 mt-0.5">Décompte réel : {nombreAppareilsReel}</span>}
              <LienContrat id={contrat.id} ton="sobre" className="block mt-1 text-xs">
                Voir les appareils couverts
              </LienContrat>
            </Champ>
            <Champ label="Sites couverts">{contrat.parcIds.length}</Champ>
            <Champ label="Période">
              {formatDateCourte(contrat.dateDebut)} — {formatDateCourte(contrat.dateFin)}
            </Champ>
            <Champ label="Fréquence de maintenance">{LIBELLE_FREQUENCE_MAINTENANCE[contrat.frequenceMaintenance]}</Champ>
            <Champ label="Niveau SLA">{LIBELLE_NIVEAU_SLA[contrat.niveauSla]}</Champ>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Maintenance incluse</h2>
          <div className="space-y-3">
            <InclusionMaintenance label="Maintenance câble" incluse={contrat.maintenanceCableIncluse} />
            <InclusionMaintenance label="Maintenance parachute" incluse={contrat.maintenanceParachuteIncluse} />
            <InclusionMaintenance label="Nettoyage" incluse={contrat.maintenanceNettoyageIncluse} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Seuils contractuels</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Champ label="Durée minimale d'intervention">{contrat.seuils.dureeMinimaleInterventionMinutes} min</Champ>
            <Champ label="Temps minimum de présence (maintenance)">{contrat.seuils.tempsMinimumPresenceMaintenanceMinutes} min</Champ>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">SLA par niveau d&apos;urgence</h2>
          {definitionsContrat.length === 0 && (
            <p className="text-xs text-gray-500 mb-3">Aucune surcharge pour ce contrat — SLA par défaut appliqué.</p>
          )}
          <ul className="divide-y divide-gray-100">
            {definitionsAffichees.map((definition) => (
              <li key={definition.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-700">{LIBELLE_NIVEAU_URGENCE[definition.niveauUrgence]}</span>
                <span className="font-medium text-gray-900">{definition.delaiMinutes} min</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Règles spécifiques</h2>
          {contrat.reglesSpecifiques && contrat.reglesSpecifiques.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {contrat.reglesSpecifiques.map((regle, idx) => (
                <li key={idx}>{regle}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Aucune règle spécifique.</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Responsables client</h2>
          {responsables.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun responsable renseigné.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {responsables.map((responsable) => (
                <div key={responsable.id} className="border border-gray-100 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-900">{responsable.nomComplet}</p>
                  <p className="text-xs text-gray-500">{responsable.fonction}</p>
                  {responsable.email && <p className="text-xs text-gray-500 mt-1">{responsable.email}</p>}
                  {responsable.telephone && <p className="text-xs text-gray-500">{responsable.telephone}</p>}
                  <div className="flex gap-2 mt-2">
                    {responsable.estContactPrincipal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200">
                        Contact principal
                      </span>
                    )}
                    {responsable.estContactUrgence && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                        Contact urgence
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
