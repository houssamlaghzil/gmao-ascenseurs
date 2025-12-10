/**
 * Page Analytics - Dashboard d'agrégation de données
 * Infographies denses et visualisations dynamiques
 */

import { getAnalyticsData } from '@/data/store';
import AnalyticsClient from './components/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const analyticsData = getAnalyticsData();

  return <AnalyticsClient data={analyticsData} />;
}
