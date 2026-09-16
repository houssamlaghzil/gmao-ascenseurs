/**
 * Onglet Règles métier de l'écran Administration (section 17) : règles
 * configurables génériques (getAllReglesMetier) — escape hatch pour les
 * règles sans entité dédiée (voir domain/types.ts, RegleMetier).
 */

import { RegleMetier, RoleUtilisateur } from '@/domain/types';
import { LIBELLE_TYPE_REGLE_METIER } from '@/lib/derived/libelles-administration';

interface ReglesMetierTabProps {
  regles: RegleMetier[];
  roleLibelles: Record<RoleUtilisateur, string>;
}

export default function ReglesMetierTab({ regles, roleLibelles }: ReglesMetierTabProps) {
  return (
    <div className="space-y-4">
      {regles.map((regle) => (
        <div key={regle.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{regle.libelle}</h3>
              <p className="text-sm text-gray-600 mt-1">{regle.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
                {LIBELLE_TYPE_REGLE_METIER[regle.type]}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                  regle.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {regle.actif ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(regle.parametres).map(([cle, valeur]) => (
              <span
                key={cle}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200"
              >
                {cle} : {String(valeur)}
              </span>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Modifiable par : {regle.modifiablePar.map((role) => roleLibelles[role]).join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}
