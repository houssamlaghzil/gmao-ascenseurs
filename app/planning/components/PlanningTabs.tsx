'use client';

/**
 * Bascule entre le planning (section 11.1/11.2) et la liste des absences
 * (section 11.3), sous forme d'onglet séparé. Même convention que
 * app/maintenances/components/MaintenancesTabs.tsx : état purement local,
 * les deux contenus sont déjà calculés côté serveur et passés en enfants.
 */

import { ReactNode, useState } from 'react';
import { CalendarRange, UserX } from 'lucide-react';

export type OngletPlanning = 'planning' | 'absences';

interface PlanningTabsProps {
  ongletInitial: OngletPlanning;
  planningContent: ReactNode;
  absencesContent: ReactNode;
}

export default function PlanningTabs({ ongletInitial, planningContent, absencesContent }: PlanningTabsProps) {
  const [onglet, setOnglet] = useState<OngletPlanning>(ongletInitial);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        <Onglet actif={onglet === 'planning'} onClick={() => setOnglet('planning')} icon={CalendarRange} label="Planning" />
        <Onglet actif={onglet === 'absences'} onClick={() => setOnglet('absences')} icon={UserX} label="Absences" />
      </div>

      <div className={onglet === 'planning' ? '' : 'hidden'}>{planningContent}</div>
      <div className={onglet === 'absences' ? '' : 'hidden'}>{absencesContent}</div>
    </div>
  );
}

function Onglet({ actif, onClick, icon: Icon, label }: { actif: boolean; onClick: () => void; icon: typeof CalendarRange; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        actif ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
