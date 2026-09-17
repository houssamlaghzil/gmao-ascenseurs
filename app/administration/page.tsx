/**
 * Administration (section 17). Server Component : toutes les jointures et
 * lectures du store se font ici ; le contenu est ensuite réparti en onglets
 * côté client (OngletsAdministration) pour éviter les sous-menus profonds,
 * comme demandé par le cahier des charges.
 */

import { Settings } from 'lucide-react';
import { RoleUtilisateur } from '@/domain/types';
import {
  getActionsDiagnosticReferentiel,
  getAllCausesPanneRef,
  getAllConfigurationsNotification,
  getAllEntreesAudit,
  getAllReglesMetier,
  getAllRolesDefinitions,
  getAllTypesMaintenanceRef,
  getAllUtilisateurs,
  getEquipementsReferentiel,
  getEtatsEquipementReferentiel,
} from '@/data/store';
import OngletsAdministration, { type OngletAdministration } from './components/OngletsAdministration';
import UtilisateursTab from './components/UtilisateursTab';
import RolesTab from './components/RolesTab';
import ReferentielsTab from './components/ReferentielsTab';
import ReglesMetierTab from './components/ReglesMetierTab';
import NotificationsTab from './components/NotificationsTab';
import AuditLogsTab from './components/AuditLogsTab';

export default function AdministrationPage() {
  const utilisateurs = getAllUtilisateurs();
  const roles = getAllRolesDefinitions();
  const roleLibelles = roles.reduce((acc, r) => {
    acc[r.role] = r.libelle;
    return acc;
  }, {} as Record<RoleUtilisateur, string>);

  const typesMaintenanceRef = getAllTypesMaintenanceRef();
  const causesPanneRef = getAllCausesPanneRef();
  const equipements = getEquipementsReferentiel();
  const etatsEquipement = getEtatsEquipementReferentiel();
  const actionsDiagnostic = getActionsDiagnosticReferentiel();

  const reglesMetier = getAllReglesMetier();
  const configurationsNotification = getAllConfigurationsNotification();
  const entreesAudit = getAllEntreesAudit();

  const tabs: OngletAdministration[] = [
    { id: 'utilisateurs', label: `Utilisateurs (${utilisateurs.length})`, content: <UtilisateursTab utilisateurs={utilisateurs} roleLibelles={roleLibelles} /> },
    { id: 'roles', label: 'Rôles & permissions', content: <RolesTab roles={roles} /> },
    {
      id: 'referentiels',
      label: 'Référentiels',
      content: (
        <ReferentielsTab
          typesMaintenanceRef={typesMaintenanceRef}
          causesPanneRef={causesPanneRef}
          equipements={equipements}
          etatsEquipement={etatsEquipement}
          actionsDiagnostic={actionsDiagnostic}
        />
      ),
    },
    { id: 'regles', label: `Règles métier (${reglesMetier.length})`, content: <ReglesMetierTab regles={reglesMetier} roleLibelles={roleLibelles} /> },
    { id: 'notifications', label: 'Notifications', content: <NotificationsTab configurations={configurationsNotification} roleLibelles={roleLibelles} /> },
    { id: 'audit', label: `Audit logs (${entreesAudit.length})`, content: <AuditLogsTab entrees={entreesAudit} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Administration
        </h1>
        <p className="mt-1 text-sm text-gray-600">Utilisateurs, rôles, référentiels, règles métier, notifications et audit.</p>
      </div>

      <OngletsAdministration tabs={tabs} />
    </div>
  );
}
