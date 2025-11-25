/**
 * Page Board Kanban - Vue drag & drop des ascenseurs par état
 * Fonctionnalité centrale de la démo GMAO
 */

import BoardClient from './components/BoardClient';

export const dynamic = 'force-dynamic';

async function getBoardData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [ascenseursRes, parcsRes, techniciensRes] = await Promise.all([
    fetch(`${baseUrl}/api/board/ascenseurs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/parcs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/techniciens`, { cache: 'no-store' }),
  ]);

  const ascenseursData = await ascenseursRes.json();
  const parcsData = await parcsRes.json();
  const techniciensData = await techniciensRes.json();

  return {
    ascenseurs: ascenseursData.success ? ascenseursData.data : [],
    parcs: parcsData.success ? parcsData.data : [],
    techniciens: techniciensData.success ? techniciensData.data : [],
  };
}

export default async function BoardPage() {
  const { ascenseurs, parcs, techniciens } = await getBoardData();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Board Ascenseurs</h1>
        <p className="mt-2 text-gray-600">
          Gérez les états des ascenseurs par glisser-déposer
        </p>
      </div>

      {/* Board Kanban */}
      <BoardClient
        initialAscenseurs={ascenseurs}
        parcs={parcs}
        techniciens={techniciens}
      />
    </div>
  );
}
