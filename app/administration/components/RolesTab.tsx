/**
 * Onglet Rôles &amp; permissions de l'écran Administration (section 17) :
 * matrice rôle → permissions accordées (getAllRolesDefinitions).
 */

import { RoleDefinition } from '@/domain/types';
import { LIBELLE_PERMISSION } from '@/lib/derived/libelles-administration';

interface RolesTabProps {
  roles: RoleDefinition[];
}

export default function RolesTab({ roles }: RolesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {roles.map((role) => (
        <div key={role.role} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900">{role.libelle}</h3>
          <p className="text-xs text-gray-500 mt-1">{role.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {role.permissions.map((permission) => (
              <span
                key={permission}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {LIBELLE_PERMISSION[permission]}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
