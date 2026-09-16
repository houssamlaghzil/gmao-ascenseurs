/**
 * État de l'appareil constaté (etatInitial/etatCloture, section 25/27) et
 * clôture du rapport (commentaireCloture, étages en mode dégradé le cas
 * échéant) — absents si accesObtenu = false.
 */

import { CategorieMaintenance, ResultatTestTelealarme, StatutAppareil } from '@/domain/types';
import StatusBadge from '@/components/StatusBadge';
import { CategorieMaintenanceBadge } from '@/components/StatusBadges';

interface EtatEtClotureRapportProps {
  etatInitial?: StatutAppareil;
  etatCloture?: StatutAppareil;
  etagesModeDegrade?: string[];
  commentaireCloture?: string;
  operationsMaintenance?: CategorieMaintenance[];
  resultatTestTelealarme?: ResultatTestTelealarme;
}

export default function EtatEtClotureRapport({
  etatInitial,
  etatCloture,
  etagesModeDegrade,
  commentaireCloture,
  operationsMaintenance,
  resultatTestTelealarme,
}: EtatEtClotureRapportProps) {
  if (!etatInitial && !etatCloture) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">État de l&apos;appareil et clôture</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">État initial</p>
          <div className="mt-1">{etatInitial ? <StatusBadge statut={etatInitial} /> : '—'}</div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">État à la clôture</p>
          <div className="mt-1">{etatCloture ? <StatusBadge statut={etatCloture} /> : '—'}</div>
        </div>
      </div>

      {etagesModeDegrade && etagesModeDegrade.length > 0 && (
        <p className="text-sm text-gray-600 mt-3">
          Étages concernés par le mode dégradé : <span className="font-medium text-gray-900">{etagesModeDegrade.join(', ')}</span>
        </p>
      )}

      {operationsMaintenance && operationsMaintenance.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Opérations de maintenance réalisées</p>
          <div className="flex flex-wrap gap-2">
            {operationsMaintenance.map((categorie) => (
              <CategorieMaintenanceBadge key={categorie} categorie={categorie} />
            ))}
          </div>
          {resultatTestTelealarme && (
            <p className="text-sm text-gray-600 mt-2">
              Test téléalarme :{' '}
              <span className={resultatTestTelealarme === ResultatTestTelealarme.FONCTIONNELLE ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                {resultatTestTelealarme === ResultatTestTelealarme.FONCTIONNELLE ? 'Fonctionnelle' : 'Défaillante'}
              </span>
            </p>
          )}
        </div>
      )}

      {commentaireCloture && (
        <p className="text-sm text-gray-700 mt-4 pt-4 border-t border-gray-100">{commentaireCloture}</p>
      )}
    </div>
  );
}
