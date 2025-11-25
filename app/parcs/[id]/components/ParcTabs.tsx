'use client';

/**
 * Composant à onglets pour la page de détail du parc
 */

import { useState } from 'react';
import AscenseursTab from './AscenseursTab';
import TechniciensTab from './TechniciensTab';

interface ParcTabsProps {
  parcId: string;
  ascenseurs: any[];
  techniciens: any[];
}

export default function ParcTabs({ parcId, ascenseurs, techniciens }: ParcTabsProps) {
  const [activeTab, setActiveTab] = useState<'ascenseurs' | 'techniciens'>('ascenseurs');

  return (
    <div>
      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ascenseurs')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'ascenseurs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Ascenseurs ({ascenseurs.length})
          </button>
          <button
            onClick={() => setActiveTab('techniciens')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'techniciens'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Techniciens ({techniciens.length})
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === 'ascenseurs' && (
          <AscenseursTab ascenseurs={ascenseurs} parcId={parcId} />
        )}
        {activeTab === 'techniciens' && (
          <TechniciensTab techniciens={techniciens} parcId={parcId} />
        )}
      </div>
    </div>
  );
}
