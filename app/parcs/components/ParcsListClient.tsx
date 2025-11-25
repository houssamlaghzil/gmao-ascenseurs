'use client';

/**
 * Composant client pour la liste des parcs avec recherche et tri
 */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ParcAscenseurs, StatistiquesParc, TypeParc } from '@/domain/types';
import { Search, ArrowUpDown, ExternalLink, Building, MapPin } from 'lucide-react';

interface ParcsListClientProps {
  initialParcs: ParcAscenseurs[];
  statistiques: StatistiquesParc[];
}

type SortField = 'nom' | 'ville' | 'totalAscenseurs';
type SortOrder = 'asc' | 'desc';

export default function ParcsListClient({ initialParcs, statistiques }: ParcsListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TypeParc | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Fonction pour obtenir les stats d'un parc
  const getStats = useCallback((parcId: string) => {
    return statistiques.find(s => s.parcId === parcId) || {
      parcId,
      totalAscenseurs: 0,
      nombreFonctionnels: 0,
      nombreEnPanne: 0,
      nombreEnReparation: 0,
    };
  }, [statistiques]);

  // Filtrage et tri
  const filteredAndSortedParcs = useMemo(() => {
    let result = [...initialParcs];

    // Recherche
    if (searchTerm) {
      result = result.filter(parc => 
        parc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parc.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parc.adresse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (filterType !== 'all') {
      result = result.filter(parc => parc.type === filterType);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'nom') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortField === 'ville') {
        comparison = a.ville.localeCompare(b.ville);
      } else if (sortField === 'totalAscenseurs') {
        const statsA = getStats(a.id);
        const statsB = getStats(b.id);
        comparison = statsA.totalAscenseurs - statsB.totalAscenseurs;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialParcs, searchTerm, filterType, sortField, sortOrder, getStats]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalStats = statistiques.reduce(
    (acc, stat) => ({
      totalAscenseurs: acc.totalAscenseurs + stat.totalAscenseurs,
      nombreFonctionnels: acc.nombreFonctionnels + stat.nombreFonctionnels,
      nombreEnPanne: acc.nombreEnPanne + stat.nombreEnPanne,
      nombreEnReparation: acc.nombreEnReparation + stat.nombreEnReparation,
    }),
    { totalAscenseurs: 0, nombreFonctionnels: 0, nombreEnPanne: 0, nombreEnReparation: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Parcs</div>
          <div className="text-2xl font-bold text-gray-900">{initialParcs.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Ascenseurs</div>
          <div className="text-2xl font-bold text-blue-600">{totalStats.totalAscenseurs}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Fonctionnels</div>
          <div className="text-2xl font-bold text-green-600">{totalStats.nombreFonctionnels}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">En Maintenance</div>
          <div className="text-2xl font-bold text-orange-600">
            {totalStats.nombreEnPanne + totalStats.nombreEnReparation}
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre par type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TypeParc | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value={TypeParc.RESIDENTIEL}>Résidentiel</option>
            <option value={TypeParc.TERTIAIRE}>Tertiaire</option>
            <option value={TypeParc.COMMERCIAL}>Commercial</option>
          </select>
        </div>

        {/* Compteur de résultats */}
        <div className="text-sm text-gray-600">
          {filteredAndSortedParcs.length} parc{filteredAndSortedParcs.length > 1 ? 's' : ''} trouvé{filteredAndSortedParcs.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('nom')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Nom
                    <ArrowUpDown className={`h-4 w-4 ${sortField === 'nom' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ville')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Ville
                    <ArrowUpDown className={`h-4 w-4 ${sortField === 'ville' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  onClick={() => handleSort('totalAscenseurs')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Ascenseurs
                    <ArrowUpDown className={`h-4 w-4 ${sortField === 'totalAscenseurs' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  États
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedParcs.map((parc) => {
                const stats = getStats(parc.id);
                return (
                  <tr key={parc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{parc.nom}</div>
                          <div className="text-xs text-gray-500">{parc.description || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {parc.ville}
                      </div>
                      <div className="text-xs text-gray-500">{parc.adresse}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {parc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{stats.totalAscenseurs}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">✓ {stats.nombreFonctionnels}</span>
                        <span className="text-red-600">⚠ {stats.nombreEnPanne}</span>
                        <span className="text-yellow-600">🔧 {stats.nombreEnReparation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/parcs/${parc.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Détails
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedParcs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun parc trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
