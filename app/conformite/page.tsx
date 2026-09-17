/**
 * Conformité contractuelle — vue parc (section 6.3 / 14).
 *
 * L'écran qui manquait : il répond à « combien de maintenances contractuelles
 * n'aurai-je pas faites au 31 décembre ? », contrat par contrat, avant que
 * l'année ne se termine et que le déficit ne devienne une pénalité.
 *
 * Server Component : tout le calcul est fait par
 * lib/derived/conformite-contractuelle.ts, en une passe mémoïsée.
 */

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { StatutContratBadge } from '@/components/StatusBadges';
import { LienClient, LienContrat } from '@/components/Liens';
import { LIBELLE_FREQUENCE_MAINTENANCE } from '@/lib/derived/libelles-contrats';
import {
  getConformiteParClient,
  getConformiteParContrat,
  getSyntheseConformite,
  lienConformiteContrat,
  lireAnnee,
} from '@/lib/derived/conformite-contractuelle';
import {
  BadgeNiveau,
  BandeauCompteurs,
  CadreTableau,
  CLASSE_TD,
  CLASSE_TD_NUM,
  CLASSE_TH,
  CLASSE_TH_NUM,
  JaugeConformite,
  OrigineDuDeficit,
  TableauCategories,
  Tuile,
  ValeurDeficit,
  niveauConformite,
  nombre,
  styleNiveau,
} from './components/ConformiteUI';

export const dynamic = 'force-dynamic';

interface ConformitePageProps {
  searchParams: { annee?: string | string[] };
}

export default function ConformitePage({ searchParams }: ConformitePageProps) {
  const annee = lireAnnee(searchParams?.annee);
  const synthese = getSyntheseConformite(annee);
  const contrats = getConformiteParContrat(annee);
  const clients = getConformiteParClient(annee);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ClipboardCheck className="h-6 w-6 text-blue-600" />
          Conformité contractuelle {annee}
        </h1>
        <p className="mt-1 max-w-4xl text-sm text-gray-600">
          Le calendrier de maintenance est contractuel : ses dates sont fixées pour l&apos;année et ne se recalculent
          jamais depuis la visite précédente. Cet écran confronte, pour chaque contrat, le quota annuel engagé à ce qui
          a été réalisé et à ce qui reste planifié. Un <strong className="font-semibold text-gray-900">déficit
          prévisible</strong> signifie que le quota ne sera pas atteint même en exécutant tout ce qui reste au
          calendrier — les 11 maintenances au lieu de 12, visibles en {annee} plutôt qu&apos;en janvier suivant.
        </p>
      </header>

      <BandeauCompteurs
        compteurs={synthese.total}
        precisionDeficit={`sur ${nombre(synthese.nombreAppareils)} appareils`}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Tuile
          libelle="Contrats en déficit"
          valeur={`${nombre(synthese.nombreContratsEnDeficit)} / ${nombre(synthese.nombreContrats)}`}
          precision="Niveau où s'appliquent les pénalités"
          accent={synthese.nombreContratsEnDeficit > 0 ? 'deficit' : 'positif'}
        />
        <Tuile
          libelle="Clients concernés"
          valeur={`${nombre(synthese.nombreClientsEnDeficit)} / ${nombre(synthese.nombreClients)}`}
          precision="Destinataires des statistiques annuelles"
          accent={synthese.nombreClientsEnDeficit > 0 ? 'deficit' : 'positif'}
        />
        <Tuile
          libelle="Appareils en déficit"
          valeur={`${nombre(synthese.nombreAppareilsEnDeficit)} / ${nombre(synthese.nombreAppareils)}`}
          precision="Un excédent ne compense jamais un appareil voisin"
          accent={synthese.nombreAppareilsEnDeficit > 0 ? 'deficit' : 'positif'}
        />
      </div>

      <OrigineDuDeficit compteurs={synthese.total} />

      <CadreTableau
        titre="Décomposition par opération"
        sousTitre="Parc entier. Le quota périodique est lu sur la fréquence du contrat ; câble et parachute suivent la cadence métier (2 et 1 par an)."
      >
        <TableauCategories lignes={synthese.parCategorie} />
      </CadreTableau>

      <CadreTableau
        titre="Par contrat"
        sousTitre={`${nombre(contrats.length)} contrats portant au moins un appareil, du déficit le plus lourd au plus léger.`}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={CLASSE_TH}>Contrat</th>
              <th className={CLASSE_TH}>Client</th>
              <th className={CLASSE_TH}>Cadence</th>
              <th className={CLASSE_TH_NUM}>Appareils</th>
              <th className={CLASSE_TH_NUM}>En déficit</th>
              <th className={CLASSE_TH_NUM}>Dus</th>
              <th className={CLASSE_TH_NUM}>Réalisés</th>
              <th className={CLASSE_TH_NUM}>Planifiés</th>
              <th className={CLASSE_TH_NUM}>Déficit</th>
              <th className={CLASSE_TH_NUM}>Conformité</th>
              <th className={CLASSE_TH}>État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contrats.map((ligne) => {
              const niveau = niveauConformite(ligne.total);
              const style = styleNiveau(niveau);
              return (
                <tr
                  key={ligne.contratId}
                  className={`${style.bordure} ${niveau === 'critique' ? 'bg-rose-50/40' : niveau === 'attention' ? 'bg-amber-50/20' : ''}`}
                >
                  <td className={CLASSE_TD}>
                    <Link
                      href={lienConformiteContrat(ligne.contratId, annee)}
                      className="rounded font-semibold text-indigo-600 underline-offset-2 hover:text-indigo-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      {ligne.numero}
                    </Link>
                    <span className="ml-2 align-middle">
                      <StatutContratBadge statut={ligne.statutContrat} />
                    </span>
                  </td>
                  <td className={CLASSE_TD}>
                    <LienClient id={ligne.clientId} ton="sobre">
                      {ligne.clientNom}
                    </LienClient>
                  </td>
                  <td className={`${CLASSE_TD} text-gray-500`}>
                    {LIBELLE_FREQUENCE_MAINTENANCE[ligne.frequenceMaintenance]}
                  </td>
                  <td className={CLASSE_TD_NUM}>
                    <LienContrat id={ligne.contratId} ton="sobre">
                      {nombre(ligne.nombreAppareils)}
                    </LienContrat>
                  </td>
                  <td className={`${CLASSE_TD_NUM} ${ligne.nombreAppareilsEnDeficit > 0 ? style.texte : 'text-gray-400'}`}>
                    {ligne.nombreAppareilsEnDeficit > 0 ? nombre(ligne.nombreAppareilsEnDeficit) : '—'}
                  </td>
                  <td className={`${CLASSE_TD_NUM} font-medium text-gray-900`}>{nombre(ligne.total.dues)}</td>
                  <td className={CLASSE_TD_NUM}>{nombre(ligne.total.realisees)}</td>
                  <td className={CLASSE_TD_NUM}>{nombre(ligne.total.planifieesRestantes)}</td>
                  <td className={CLASSE_TD_NUM}>
                    <ValeurDeficit compteurs={ligne.total} />
                  </td>
                  <td className={CLASSE_TD_NUM}>
                    <JaugeConformite compteurs={ligne.total} largeur="w-16" />
                  </td>
                  <td className={CLASSE_TD}>
                    <BadgeNiveau compteurs={ligne.total} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CadreTableau>

      <CadreTableau
        titre="Par client"
        sousTitre="Même lecture au niveau du donneur d'ordre : c'est à ce niveau que sont transmises les statistiques annuelles."
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={CLASSE_TH}>Client</th>
              <th className={CLASSE_TH_NUM}>Contrats</th>
              <th className={CLASSE_TH_NUM}>Appareils</th>
              <th className={CLASSE_TH_NUM}>Appareils en déficit</th>
              <th className={CLASSE_TH_NUM}>Dus</th>
              <th className={CLASSE_TH_NUM}>Réalisés</th>
              <th className={CLASSE_TH_NUM}>Planifiés</th>
              <th className={CLASSE_TH_NUM}>Déficit</th>
              <th className={CLASSE_TH_NUM}>Conformité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((ligne) => (
              <tr key={ligne.clientId} className={ligne.total.deficit > 0 ? 'bg-rose-50/20' : undefined}>
                <td className={CLASSE_TD}>
                  <LienClient id={ligne.clientId}>{ligne.clientNom}</LienClient>
                </td>
                <td className={CLASSE_TD_NUM}>
                  {ligne.nombreContratsEnDeficit > 0
                    ? `${nombre(ligne.nombreContratsEnDeficit)} / ${nombre(ligne.nombreContrats)}`
                    : nombre(ligne.nombreContrats)}
                </td>
                <td className={CLASSE_TD_NUM}>{nombre(ligne.nombreAppareils)}</td>
                <td className={`${CLASSE_TD_NUM} ${ligne.nombreAppareilsEnDeficit > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                  {ligne.nombreAppareilsEnDeficit > 0 ? nombre(ligne.nombreAppareilsEnDeficit) : '—'}
                </td>
                <td className={`${CLASSE_TD_NUM} font-medium text-gray-900`}>{nombre(ligne.total.dues)}</td>
                <td className={CLASSE_TD_NUM}>{nombre(ligne.total.realisees)}</td>
                <td className={CLASSE_TD_NUM}>{nombre(ligne.total.planifieesRestantes)}</td>
                <td className={CLASSE_TD_NUM}>
                  <ValeurDeficit compteurs={ligne.total} />
                </td>
                <td className={CLASSE_TD_NUM}>
                  <JaugeConformite compteurs={ligne.total} largeur="w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CadreTableau>
    </div>
  );
}
