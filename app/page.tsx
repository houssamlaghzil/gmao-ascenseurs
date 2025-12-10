/**
 * Page Dashboard - Vue d'ensemble de tous les parcs
 * Version simplifiée avec appels API directs au store
 */

import { TrendingUp } from 'lucide-react';
import { getAllParcs, getAllStatistiques, getRecentEvenements, getHighRiskAscenseurs } from '@/data/store';
import Link from 'next/link';
import StatCard from './components/StatCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Appel direct au store au lieu de passer par les API routes
  const parcs = getAllParcs();
  const statistiques = getAllStatistiques();
  const evenements = getRecentEvenements(10);
  const ascenseursRisque = getHighRiskAscenseurs(5);
  
  const parcsWithStats = parcs.map((parc) => ({
    ...parc,
    stats: statistiques.find((s) => s.parcId === parc.id),
  }));

  // Calculer les statistiques globales
  const statsGlobales = statistiques.reduce(
    (acc, stat) => ({
      totalAscenseurs: acc.totalAscenseurs + stat.totalAscenseurs,
      nombreFonctionnels: acc.nombreFonctionnels + stat.nombreFonctionnels,
      nombreEnPanne: acc.nombreEnPanne + stat.nombreEnPanne,
      nombreEnReparation: acc.nombreEnReparation + stat.nombreEnReparation,
    }),
    {
      totalAscenseurs: 0,
      nombreFonctionnels: 0,
      nombreEnPanne: 0,
      nombreEnReparation: 0,
    }
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard GMAO</h1>
        <p className="mt-2 text-gray-600">
          Vue d&apos;ensemble et maintenance prédictive
        </p>
      </div>

      {/* Statistiques globales - Cartes cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Ascenseurs"
          value={statsGlobales.totalAscenseurs}
          iconName="building"
          color="blue"
          href="/ascenseurs"
        />
        <StatCard
          label="Fonctionnels"
          value={statsGlobales.nombreFonctionnels}
          iconName="activity"
          color="green"
          href="/ascenseurs?etat=fonctionnel"
        />
        <StatCard
          label="En Panne"
          value={statsGlobales.nombreEnPanne}
          iconName="alert-circle"
          color="red"
          href="/ascenseurs?etat=en_panne"
        />
        <StatCard
          label="En Réparation"
          value={statsGlobales.nombreEnReparation}
          iconName="wrench"
          color="yellow"
          href="/ascenseurs?etat=en_cours_de_reparation"
        />
      </div>

      {/* Parcs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Vos Parcs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {parcsWithStats.map((parc) => (
            <Link
              key={parc.id}
              href={`/parcs/${parc.id}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900">{parc.nom}</h3>
              <p className="text-sm text-gray-600 mt-1">{parc.ville}</p>
              {parc.stats && (
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="text-gray-600">Total: <strong>{parc.stats.totalAscenseurs}</strong></span>
                  <span className="text-emerald-600">✓ {parc.stats.nombreFonctionnels}</span>
                  <span className="text-rose-600">⚠ {parc.stats.nombreEnPanne}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Ascenseurs à risque élevé */}
      {ascenseursRisque.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Maintenance Prédictive - Ascenseurs à Risque
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ascenseursRisque.map((asc) => {
              const parc = parcs.find((p) => p.id === asc.parcId);
              return (
                <div
                  key={asc.id}
                  className="bg-white border border-purple-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900">{asc.nom}</h3>
                  {parc && (
                    <p className="text-sm text-gray-600">{parc.nom}</p>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Risque panne 7j</span>
                      <span className="text-sm font-bold text-purple-600">{asc.riskScore.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${asc.riskScore.score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{asc.riskScore.explication}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
