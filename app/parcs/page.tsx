/**
 * Page de liste des parcs avec recherche et tri
 */

import { Suspense } from 'react';
import ParcsListClient from './components/ParcsListClient';
import { SkeletonTable } from '@/components/skeletons';

export const dynamic = 'force-dynamic';

async function getParcsData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [parcsRes, statistiquesRes] = await Promise.all([
    fetch(`${baseUrl}/api/parcs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/parcs/statistiques`, { cache: 'no-store' }),
  ]);

  const parcsData = await parcsRes.json();
  const statistiquesData = await statistiquesRes.json();

  return {
    parcs: parcsData.success ? parcsData.data : [],
    statistiques: statistiquesData.success ? statistiquesData.data : [],
  };
}

export default async function ParcsPage() {
  const { parcs, statistiques } = await getParcsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Liste des Parcs</h1>
        <p className="mt-2 text-gray-600">
          Consultez et gérez tous vos parcs d'ascenseurs
        </p>
      </div>

      <Suspense fallback={<SkeletonTable rows={8} columns={5} />}>
        <ParcsListClient initialParcs={parcs} statistiques={statistiques} />
      </Suspense>
    </div>
  );
}
