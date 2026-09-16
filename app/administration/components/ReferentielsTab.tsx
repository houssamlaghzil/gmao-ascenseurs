/**
 * Onglet Référentiels de l'écran Administration (section 17) : les
 * référentiels administrables du modèle (types de maintenance "autre",
 * causes de panne, et la chaîne équipement → état constaté → action du
 * diagnostic progressif, section 26).
 */

import {
  ActionDiagnosticReferentiel,
  CausePanneRef,
  EquipementReferentiel,
  EtatEquipementReferentiel,
  TypeMaintenanceRef,
} from '@/domain/types';
import { LIBELLE_LOCAL_DIAGNOSTIC } from '@/lib/derived/libelles-rapports';

interface ReferentielsTabProps {
  typesMaintenanceRef: TypeMaintenanceRef[];
  causesPanneRef: CausePanneRef[];
  equipements: EquipementReferentiel[];
  etatsEquipement: EtatEquipementReferentiel[];
  actionsDiagnostic: ActionDiagnosticReferentiel[];
}

function CarteReferentiel({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function PastilleEtat({ actif, modifiable }: { actif: boolean; modifiable: boolean }) {
  return (
    <div className="flex gap-1.5">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
          actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}
      >
        {actif ? 'Actif' : 'Inactif'}
      </span>
      {!modifiable && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
          Socle
        </span>
      )}
    </div>
  );
}

export default function ReferentielsTab({
  typesMaintenanceRef,
  causesPanneRef,
  equipements,
  etatsEquipement,
  actionsDiagnostic,
}: ReferentielsTabProps) {
  return (
    <div className="space-y-4">
      <CarteReferentiel titre='Types de maintenance "autre" (section 6.1)'>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Couleur</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Durée min. par défaut</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {typesMaintenanceRef.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.libelle}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {item.couleur && (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: item.couleur }} />
                      <span className="text-gray-500">{item.couleur}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                  {item.dureeMinimaleMinutesParDefaut ? `${item.dureeMinimaleMinutesParDefaut} min` : '—'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PastilleEtat actif={item.actif} modifiable={item.modifiable} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CarteReferentiel>

      <CarteReferentiel titre="Causes de panne (section 26)">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {causesPanneRef.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.libelle}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.categorie}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PastilleEtat actif={item.actif} modifiable={item.modifiable} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CarteReferentiel>

      <CarteReferentiel titre="Diagnostic progressif — Équipements (section 26, étape 4)">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Locaux compatibles</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {equipements.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.libelle}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {item.localsCompatibles.map((local) => LIBELLE_LOCAL_DIAGNOSTIC[local]).join(', ')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PastilleEtat actif={item.actif} modifiable={item.modifiable} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CarteReferentiel>

      <CarteReferentiel titre="Diagnostic progressif — États constatés (section 26, étape 5)">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce cassée</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {etatsEquipement.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.libelle}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.indiquePieceCassee ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PastilleEtat actif={item.actif} modifiable={item.modifiable} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CarteReferentiel>

      <CarteReferentiel titre="Diagnostic progressif — Actions (section 26, étape 6)">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce détachée nécessaire</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {actionsDiagnostic.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.libelle}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.necessitePieceDetachee ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <PastilleEtat actif={item.actif} modifiable={item.modifiable} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CarteReferentiel>
    </div>
  );
}
