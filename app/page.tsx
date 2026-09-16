/**
 * Tableau de bord — cahier des charges, section 3.
 *
 * Server Component : lit directement le store en mémoire (@/data/store),
 * pas de fetch() vers /api. Absorbe l'ancienne page Analytics (app/analytics/**),
 * retirée de la navigation et supprimée — son contenu (KPI, graphiques,
 * tendances) vit désormais ici.
 */

import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Inbox,
  PauseCircle,
  ShieldAlert,
  TimerOff,
  Wrench,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import { DonutChart, GaugeChart, Heatmap } from '@/components/charts';
import UrgencesPanel from './components/UrgencesPanel';
import NotificationsPanel from './components/NotificationsPanel';
import RisqueAscenseursPanel from './components/RisqueAscenseursPanel';
import {
  ChargeTechnicien,
  getActiviteParJour,
  getActiviteRecente,
  getAscenseursAvecRisque,
  getChargeTechniciens,
  getKpisTableauDeBord,
  getRepartitionCausesPanne,
  getRepartitionInterventions,
  getRepartitionMaintenances,
  getTauxDisponibiliteParc,
  getTauxRespectSLAGlobal,
  getTopAscenseursRisque,
  getUrgences,
} from '@/lib/derived/dashboard';

export const dynamic = 'force-dynamic';

const COLOR_STOPS_TAUX = [
  { offset: '0%', color: '#ef4444' },
  { offset: '50%', color: '#eab308' },
  { offset: '100%', color: '#22c55e' },
];

export default function TableauDeBordPage() {
  const kpis = getKpisTableauDeBord();
  const activiteParJour = getActiviteParJour(90);
  const tauxDisponibilite = getTauxDisponibiliteParc();
  const repartitionInterventions = getRepartitionInterventions();
  const repartitionMaintenances = getRepartitionMaintenances();
  const repartitionCausesPanne = getRepartitionCausesPanne();
  const tauxRespectSLA = getTauxRespectSLAGlobal();
  const chargeTechniciens = getChargeTechniciens(8);
  const ascenseursAvecRisque = getAscenseursAvecRisque();
  const topRisque = getTopAscenseursRisque(ascenseursAvecRisque, 5);
  const urgences = getUrgences(ascenseursAvecRisque);
  const activiteRecente = getActiviteRecente(15);

  const maintenancesRealisees = repartitionMaintenances.find((s) => s.label === 'Réalisées')?.value ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">
          Vue d&apos;ensemble du parc de {kpis.totalAscenseurs.toLocaleString('fr-FR')} ascenseurs
        </p>
      </header>

      {/* 3.1 — KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="En service" value={kpis.enService} icon={<CheckCircle2 className="h-7 w-7" />} colorClass="text-emerald-600" />
        <StatCard title="En panne" value={kpis.enPanne} icon={<AlertTriangle className="h-7 w-7" />} colorClass="text-rose-600" />
        <StatCard title="À l'arrêt" value={kpis.aLArret} icon={<PauseCircle className="h-7 w-7" />} colorClass="text-orange-600" />
        <StatCard title="Mode dégradé" value={kpis.modeDegrade} icon={<ShieldAlert className="h-7 w-7" />} colorClass="text-amber-600" />
        <StatCard title="Interventions ouvertes" value={kpis.interventionsOuvertes} icon={<Wrench className="h-7 w-7" />} colorClass="text-indigo-600" />
        <StatCard title="Interventions hors SLA" value={kpis.interventionsHorsSLA} icon={<TimerOff className="h-7 w-7" />} colorClass="text-rose-600" />
        <StatCard title="Maintenances en retard" value={kpis.maintenancesEnRetard} icon={<CalendarClock className="h-7 w-7" />} colorClass="text-orange-600" />
        <StatCard title="Maintenances cette semaine" value={kpis.maintenancesCetteSemaine} icon={<CalendarCheck className="h-7 w-7" />} colorClass="text-sky-600" />
        <StatCard title="Tickets non affectés" value={kpis.ticketsNonAffectes} icon={<Inbox className="h-7 w-7" />} colorClass="text-purple-600" />
      </div>

      {/* 3.2 — Graphiques et tendances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Disponibilité du parc" subtitle="Appareils en service">
          <div className="flex justify-center">
            <GaugeChart value={tauxDisponibilite} label="Disponibilité" colorStops={COLOR_STOPS_TAUX} />
          </div>
        </Card>
        <Card title="Respect du SLA" subtitle="Toutes interventions confondues">
          <div className="flex justify-center">
            <GaugeChart value={tauxRespectSLA} label="Dans les délais" colorStops={COLOR_STOPS_TAUX} />
          </div>
        </Card>
        <Card title="Interventions" subtitle="Ouvertes / clôturées">
          <DonutChart
            segments={repartitionInterventions}
            size={160}
            centerValue={kpis.interventionsOuvertes}
            centerLabel="Ouvertes"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Maintenances" subtitle="Répartition par statut">
          <DonutChart segments={repartitionMaintenances} size={160} centerValue={maintenancesRealisees} centerLabel="Réalisées" />
        </Card>
        <Card title="Causes de panne" subtitle="Répartition par motif d'intervention">
          <DonutChart segments={repartitionCausesPanne} size={160} strokeWidth={20} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Activité sur 90 jours" subtitle="Interventions créées et maintenances réalisées" className="lg:col-span-2">
          <Heatmap data={activiteParJour} />
        </Card>
        <Card title="Charge par technicien" subtitle="Interventions actives + maintenances à venir">
          <ChargeTechniciensList items={chargeTechniciens} />
        </Card>
      </div>

      {/* 3.3 — Urgences */}
      <UrgencesPanel groupes={urgences} />

      {/* 3.4 — Activité récente + maintenance prédictive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotificationsPanel items={activiteRecente} />
        <RisqueAscenseursPanel items={topRisque} />
      </div>
    </div>
  );
}

function ChargeTechniciensList({ items }: { items: ChargeTechnicien[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Aucune charge active pour le moment.</p>;
  }
  const max = Math.max(...items.map((t) => t.total));
  return (
    <div className="space-y-3">
      {items.map((t) => (
        <div key={t.id}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-700 truncate">{t.nom}</span>
            <span className="text-gray-500">{t.total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-indigo-500" style={{ width: `${(t.interventionsActives / max) * 100}%` }} />
            <div className="h-full bg-sky-400" style={{ width: `${(t.maintenancesAVenir / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Interventions actives
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Maintenances à venir
        </span>
      </div>
    </div>
  );
}
