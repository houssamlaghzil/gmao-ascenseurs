'use client';

/**
 * Composant client principal pour la page Analytics
 * Dashboard dense avec infographies et visualisations dynamiques
 */

import { AnalyticsData } from '@/data/store';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Clock, 
  AlertTriangle,
  Wrench,
  Activity,
  MapPin,
  Zap
} from 'lucide-react';
import { DonutChart, Sparkline, Heatmap, GaugeChart, CountUp } from '@/components/charts';

interface AnalyticsClientProps {
  data: AnalyticsData;
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Analytics & Insights
          </h1>
          <p className="mt-1 text-gray-600">
            Agrégation en temps réel de {data.totalAscenseurs} ascenseurs sur {data.totalParcs} parcs
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Dernière mise à jour</div>
          <div className="text-lg font-semibold text-gray-900">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <KPICard
          icon={<Building2 className="h-5 w-5" />}
          label="Ascenseurs"
          value={data.totalAscenseurs}
          color="blue"
        />
        <KPICard
          icon={<MapPin className="h-5 w-5" />}
          label="Parcs"
          value={data.totalParcs}
          color="purple"
        />
        <KPICard
          icon={<Users className="h-5 w-5" />}
          label="Techniciens"
          value={data.totalTechniciens}
          color="cyan"
        />
        <KPICard
          icon={<Activity className="h-5 w-5" />}
          label="Disponibilité"
          value={data.tauxDisponibilite}
          suffix="%"
          color="emerald"
        />
        <KPICard
          icon={<Clock className="h-5 w-5" />}
          label="MTTR"
          value={data.mttr}
          suffix="h"
          color="amber"
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Pannes/7j"
          value={data.pannesParSemaine}
          color="rose"
        />
        <KPICard
          icon={<Zap className="h-5 w-5" />}
          label="Pannes/30j"
          value={data.pannesMois}
          color="orange"
        />
        <KPICard
          icon={<Wrench className="h-5 w-5" />}
          label="En cours"
          value={data.reparationsEnCours}
          color="indigo"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart - Répartition états */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Répartition des États
          </h2>
          <DonutChart
            segments={[
              { 
                value: data.totalAscenseurs - data.reparationsEnCours - data.pannesParSemaine, 
                color: '#10b981', 
                label: 'Fonctionnels' 
              },
              { value: data.pannesParSemaine, color: '#f43f5e', label: 'En panne' },
              { value: data.reparationsEnCours, color: '#f59e0b', label: 'En réparation' },
            ]}
            size={180}
            centerValue={`${data.tauxDisponibilite}%`}
            centerLabel="Disponibilité"
          />
        </div>

        {/* Gauge - Taux de disponibilité */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Performance Globale
          </h2>
          <div className="flex flex-col items-center gap-4">
            <GaugeChart
              value={data.tauxDisponibilite}
              size={160}
              label="Taux de disponibilité"
              colorStops={[
                { offset: '0%', color: '#ef4444' },
                { offset: '50%', color: '#eab308' },
                { offset: '100%', color: '#22c55e' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  <CountUp end={data.mttr} suffix="h" />
                </div>
                <div className="text-xs text-gray-500">Temps moyen réparation</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  <CountUp end={data.pannesMois} />
                </div>
                <div className="text-xs text-gray-500">Pannes ce mois</div>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par type de parc */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Par Type de Parc
          </h2>
          <div className="space-y-4">
            <TypeParcBar
              label="Commercial"
              total={data.repartitionTypeParc.commercial.total}
              fonctionnels={data.repartitionTypeParc.commercial.fonctionnels}
              color="#8b5cf6"
            />
            <TypeParcBar
              label="Tertiaire"
              total={data.repartitionTypeParc.tertiaire.total}
              fonctionnels={data.repartitionTypeParc.tertiaire.fonctionnels}
              color="#6366f1"
            />
            <TypeParcBar
              label="Résidentiel"
              total={data.repartitionTypeParc.residentiel.total}
              fonctionnels={data.repartitionTypeParc.residentiel.fonctionnels}
              color="#0ea5e9"
            />
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Activité sur 90 Jours
        </h2>
        <Heatmap data={data.activiteParJour} />
      </div>

      {/* Parcs Stats Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600" />
          Performance par Parc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {data.parcsStats.map((parc) => (
            <ParcCard key={parc.parcId} parc={parc} />
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Techniciens */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Top Techniciens (30 jours)
          </h2>
          <div className="space-y-3">
            {data.techniciensPerf.slice(0, 8).map((tech, index) => (
              <TechnicienRow key={tech.id} tech={tech} rank={index + 1} />
            ))}
          </div>
        </div>

        {/* Top Pannes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-indigo-600" />
            Types de Pannes Fréquentes
          </h2>
          <div className="space-y-3">
            {data.topPannes.map((panne, index) => (
              <PanneRow key={index} panne={panne} maxCount={data.topPannes[0].count} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Sub-components ==========

function KPICard({ 
  icon, 
  label, 
  value, 
  suffix = '', 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  suffix?: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        <CountUp end={value} />{suffix}
      </div>
    </div>
  );
}

function TypeParcBar({ 
  label, 
  total, 
  fonctionnels, 
  color 
}: { 
  label: string; 
  total: number; 
  fonctionnels: number; 
  color: string;
}) {
  const percentage = total > 0 ? Math.round((fonctionnels / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{fonctionnels}/{total} ({percentage}%)</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ParcCard({ parc }: { parc: AnalyticsData['parcsStats'][0] }) {
  const disponibilite = parc.total > 0 
    ? Math.round((parc.fonctionnels / parc.total) * 100) 
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'commercial': return 'bg-purple-100 text-purple-700';
      case 'tertiaire': return 'bg-indigo-100 text-indigo-700';
      case 'residentiel': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{parc.nom}</h3>
          <p className="text-xs text-gray-500">{parc.ville}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(parc.type)}`}>
          {parc.type}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{parc.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">{parc.fonctionnels}</div>
          <div className="text-xs text-gray-500">OK</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-rose-600">{parc.enPanne}</div>
          <div className="text-xs text-gray-500">Panne</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Sparkline 
          data={parc.tendance7j} 
          width={80} 
          height={24} 
          color={disponibilite > 80 ? '#10b981' : disponibilite > 60 ? '#f59e0b' : '#ef4444'}
        />
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{disponibilite}%</div>
          <div className="text-xs text-gray-500">dispo</div>
        </div>
      </div>
    </div>
  );
}

function TechnicienRow({ 
  tech, 
  rank 
}: { 
  tech: AnalyticsData['techniciensPerf'][0]; 
  rank: number;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        rank <= 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
      }`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{tech.nom}</div>
        <div className="text-xs text-gray-500 truncate">{tech.specialite}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-gray-900">{tech.interventions30j}</div>
        <div className="text-xs text-gray-500">interventions</div>
      </div>
      {tech.interventionsEnCours > 0 && (
        <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          {tech.interventionsEnCours} en cours
        </div>
      )}
    </div>
  );
}

function PanneRow({ 
  panne, 
  maxCount 
}: { 
  panne: { type: string; count: number }; 
  maxCount: number;
}) {
  const percentage = (panne.count / maxCount) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700">{panne.type}</span>
          <span className="font-semibold text-gray-900">{panne.count}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
