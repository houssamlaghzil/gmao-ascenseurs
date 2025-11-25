/**
 * Page de gestion complète avec drag & drop
 * Permet d'ajouter/modifier des parcs et ascenseurs
 */

import GestionClient from './components/GestionClient';

export const dynamic = 'force-dynamic';

async function getGestionData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [parcsRes, ascenseursRes] = await Promise.all([
    fetch(`${baseUrl}/api/parcs`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/ascenseurs`, { cache: 'no-store' }),
  ]);

  const parcsData = await parcsRes.json();
  const ascenseursData = await ascenseursRes.json();

  return {
    parcs: parcsData.success ? parcsData.data : [],
    ascenseurs: ascenseursData.success ? ascenseursData.data : [],
  };
}

export default async function GestionPage() {
  const { parcs, ascenseurs } = await getGestionData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos parcs et ascenseurs avec drag & drop
          </p>
        </div>
      </div>

      <GestionClient initialParcs={parcs} initialAscenseurs={ascenseurs} />
    </div>
  );
}
