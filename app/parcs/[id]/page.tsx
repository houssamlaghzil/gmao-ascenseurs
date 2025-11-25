/**
 * Page de détail d'un parc
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Building, Activity, AlertCircle, Wrench } from 'lucide-react';
import ParcTabs from './components/ParcTabs';

export const dynamic = 'force-dynamic';

async function getParcData(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [parcRes, ascenseursRes, techniciensRes] = await Promise.all([
    fetch(`${baseUrl}/api/parcs/${id}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/parcs/${id}/ascenseurs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/parcs/${id}/techniciens`, { cache: 'no-store' }),
  ]);

  if (!parcRes.ok) {
    return null;
  }

  const parcData = await parcRes.json();
  const ascenseursData = await ascenseursRes.json();
  const techniciensData = await techniciensRes.json();

  return {
    parc: parcData.success ? parcData.data : null,
    ascenseurs: ascenseursData.success ? ascenseursData.data : [],
    techniciens: techniciensData.success ? techniciensData.data : [],
  };
}

export default async function ParcDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getParcData(params.id);

  if (!data || !data.parc) {
    notFound();
  }

  const { parc, ascenseurs, techniciens } = data;
  const stats = parc.stats || {
    totalAscenseurs: 0,
    nombreFonctionnels: 0,
    nombreEnPanne: 0,
    nombreEnReparation: 0,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-primary-600 flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{parc.nom}</span>
      </div>

      {/* En-tête du parc */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{parc.nom}</h1>
            <p className="text-gray-600 mt-2">{parc.description}</p>
            <div className="flex items-center text-gray-500 mt-3">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {parc.adresse}, {parc.ville}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques du parc */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ascenseurs"
          value={stats.totalAscenseurs}
          icon={<Building className="h-6 w-6" />}
          colorClass="text-primary-600"
        />
        <StatCard
          title="Fonctionnels"
          value={stats.nombreFonctionnels}
          icon={<Activity className="h-6 w-6" />}
          colorClass="text-green-600"
        />
        <StatCard
          title="En Panne"
          value={stats.nombreEnPanne}
          icon={<AlertCircle className="h-6 w-6" />}
          colorClass="text-red-600"
        />
        <StatCard
          title="En Réparation"
          value={stats.nombreEnReparation}
          icon={<Wrench className="h-6 w-6" />}
          colorClass="text-yellow-600"
        />
      </div>

      {/* Onglets */}
      <ParcTabs
        parcId={params.id}
        ascenseurs={ascenseurs}
        techniciens={techniciens}
      />
    </div>
  );
}
