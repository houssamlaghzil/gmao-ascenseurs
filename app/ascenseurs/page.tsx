/**
 * Page de liste des ascenseurs avec filtres, recherche et tri
 */

import { Suspense } from 'react';
import AscenseursListClient from './components/AscenseursListClient';
import { SkeletonTable } from '@/components/skeletons';

export const dynamic = 'force-dynamic';

async function getAscenseursData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [ascenseursRes, parcsRes] = await Promise.all([
    fetch(`${baseUrl}/api/ascenseurs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/parcs`, { cache: 'no-store' }),
  ]);

  const ascenseursData = await ascenseursRes.json();
  const parcsData = await parcsRes.json();

  return {
    ascenseurs: ascenseursData.success ? ascenseursData.data : [],
    parcs: parcsData.success ? parcsData.data : [],
  };
}

export default async function AscenseursPage() {
  const { ascenseurs, parcs } = await getAscenseursData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Liste des Ascenseurs</h1>
        <p className="mt-2 text-gray-600">
          Consultez, recherchez et filtrez tous vos ascenseurs
        </p>
      </div>

      <Suspense fallback={<SkeletonTable rows={10} columns={6} />}>
        <AscenseursListClient initialAscenseurs={ascenseurs} parcs={parcs} />
      </Suspense>
    </div>
  );
}
