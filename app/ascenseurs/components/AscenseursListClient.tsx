'use client';

/**
 * Composant client pour la liste des ascenseurs avec recherche, filtres et tri
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Ascenseur, ParcAscenseurs, EtatGlobal } from '@/domain/types';
import { Search, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

interface AscenseursListClientProps {
  initialAscenseurs: Ascenseur[];
  parcs: ParcAscenseurs[];
}

type SortField = 'nom' | 'parc' | 'etatGlobal';
type SortOrder = 'asc' | 'desc';

export default function AscenseursListClient({ initialAscenseurs, parcs }: AscenseursListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // État initial depuis URL
  const filterFromUrl = searchParams.get('etat') as EtatGlobal | null;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtat, setFilterEtat] = useState<EtatGlobal | 'all'>(filterFromUrl || 'all');
  const [filterParc, setFilterParc] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isAnimating, setIsAnimating] = useState(!!filterFromUrl);

  // Animation d'entrée si venant du dashboard
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Fonction pour obtenir le nom du parc
  const getParcName = useCallback((parcId: string) => {
    const parc = parcs.find(p => p.id === parcId);
    return parc ? parc.nom : 'Parc inconnu';
  }, [parcs]);

  // Filtrage et tri
  const filteredAndSortedAscenseurs = useMemo(() => {
    let result = [...initialAscenseurs];

    // Recherche
    if (searchTerm) {
      result = result.filter(asc => 
        asc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asc.referenceTechnique?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getParcName(asc.parcId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre état
    if (filterEtat !== 'all') {
      result = result.filter(asc => asc.etatGlobal === filterEtat);
    }

    // Filtre parc
    if (filterParc !== 'all') {
      result = result.filter(asc => asc.parcId === filterParc);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'nom') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortField === 'parc') {
        comparison = getParcName(a.parcId).localeCompare(getParcName(b.parcId));
      } else if (sortField === 'etatGlobal') {
        comparison = a.etatGlobal.localeCompare(b.etatGlobal);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialAscenseurs, searchTerm, filterEtat, filterParc, sortField, sortOrder, getParcName]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const stats = {
    total: initialAscenseurs.length,
    fonctionnels: initialAscenseurs.filter(a => a.etatGlobal === EtatGlobal.FONCTIONNEL).length,
    enPanne: initialAscenseurs.filter(a => a.etatGlobal === EtatGlobal.EN_PANNE).length,
    enReparation: initialAscenseurs.filter(a => a.etatGlobal === EtatGlobal.EN_COURS_DE_REPARATION).length,
  };

  return (
    <div className={`transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilterEtat('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterEtat === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </button>
        <button
          onClick={() => setFilterEtat(EtatGlobal.FONCTIONNEL)}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterEtat === EtatGlobal.FONCTIONNEL ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Fonctionnels</div>
          <div className="text-2xl font-bold text-green-600">{stats.fonctionnels}</div>
        </button>
        <button
          onClick={() => setFilterEtat(EtatGlobal.EN_PANNE)}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterEtat === EtatGlobal.EN_PANNE ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">En Panne</div>
          <div className="text-2xl font-bold text-red-600">{stats.enPanne}</div>
        </button>
        <button
          onClick={() => setFilterEtat(EtatGlobal.EN_COURS_DE_REPARATION)}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterEtat === EtatGlobal.EN_COURS_DE_REPARATION ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">En Réparation</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.enReparation}</div>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence ou parc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre par parc */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterParc}
              onChange={(e) => setFilterParc(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les parcs</option>
              {parcs.map(parc => (
                <option key={parc.id} value={parc.id}>{parc.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="text-sm text-gray-600">
          {filteredAndSortedAscenseurs.length} résultat{filteredAndSortedAscenseurs.length > 1 ? 's' : ''} trouvé{filteredAndSortedAscenseurs.length > 1 ? 's' : ''}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th 
                  onClick={() => handleSort('parc')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Parc
                    <ArrowUpDown className={`h-4 w-4 ${sortField === 'parc' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('etatGlobal')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    État
                    <ArrowUpDown className={`h-4 w-4 ${sortField === 'etatGlobal' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedAscenseurs.map((ascenseur) => (
                <tr key={ascenseur.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ascenseur.nom}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{ascenseur.referenceTechnique || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getParcName(ascenseur.parcId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge etatGlobal={ascenseur.etatGlobal} sousEtatPanne={ascenseur.sousEtatPanne} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      href={`/ascenseurs/${ascenseur.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Détails
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedAscenseurs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ascenseur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
