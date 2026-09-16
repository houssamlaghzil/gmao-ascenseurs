'use client';

/**
 * Bascule entre la vue prioritaire (section 6.2) et la vue calendrier
 * (section 6.1), sous forme d'onglet séparé. État purement local ('use
 * client') : les deux contenus sont déjà calculés côté serveur et passés en
 * enfants, la bascule n'a donc besoin d'aucun aller-retour serveur — on
 * garde les deux montés (`hidden` plutôt que démonté) pour ne pas perdre
 * l'état local de la vue calendrier (granularité, cf. VueCalendrier) en
 * changeant d'onglet.
 *
 * `ongletInitial` vient du paramètre d'URL `onglet`, positionné par les
 * liens de navigation de la vue calendrier (mois/semaine précédent-suivant)
 * afin qu'un rechargement de page reste sur le bon onglet.
 */

import { ReactNode, useState } from 'react';
import { ClipboardList, CalendarDays } from 'lucide-react';

export type OngletMaintenances = 'prioritaire' | 'calendrier';

interface MaintenancesTabsProps {
  ongletInitial: OngletMaintenances;
  prioritaireContent: ReactNode;
  calendrierContent: ReactNode;
}

export default function MaintenancesTabs({ ongletInitial, prioritaireContent, calendrierContent }: MaintenancesTabsProps) {
  const [onglet, setOnglet] = useState<OngletMaintenances>(ongletInitial);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        <Onglet actif={onglet === 'prioritaire'} onClick={() => setOnglet('prioritaire')} icon={ClipboardList} label="Vue prioritaire" />
        <Onglet actif={onglet === 'calendrier'} onClick={() => setOnglet('calendrier')} icon={CalendarDays} label="Vue calendrier" />
      </div>

      <div className={onglet === 'prioritaire' ? '' : 'hidden'}>{prioritaireContent}</div>
      <div className={onglet === 'calendrier' ? '' : 'hidden'}>{calendrierContent}</div>
    </div>
  );
}

function Onglet({ actif, onClick, icon: Icon, label }: { actif: boolean; onClick: () => void; icon: typeof ClipboardList; label: string }) {
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
