/**
 * Page de détail d'un ascenseur
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import AscenseurActions from './components/AscenseurActions';
import Card from '@/components/Card';

export const dynamic = 'force-dynamic';

async function getAscenseurData(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const [ascenseurRes, historiqueRes] = await Promise.all([
    fetch(`${baseUrl}/api/ascenseurs/${id}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/ascenseurs/${id}/historique`, { cache: 'no-store' }),
  ]);

  if (!ascenseurRes.ok) {
    return null;
  }

  const ascenseurData = await ascenseurRes.json();
  const historiqueData = await historiqueRes.json();

  // Récupérer aussi le parc
  const parc = ascenseurData.success
    ? await fetch(`${baseUrl}/api/parcs/${ascenseurData.data.parcId}`, {
        cache: 'no-store',
      }).then((r) => r.json())
    : null;

  return {
    ascenseur: ascenseurData.success ? ascenseurData.data : null,
    historique: historiqueData.success ? historiqueData.data : [],
    parc: parc?.success ? parc.data : null,
  };
}

export default async function AscenseurDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getAscenseurData(params.id);

  if (!data || !data.ascenseur) {
    notFound();
  }

  const { ascenseur, historique, parc } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-primary-600">
          Dashboard
        </Link>
        {parc && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/parcs/${parc.id}`}
              className="hover:text-primary-600"
            >
              {parc.nom}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{ascenseur.nom}</span>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {ascenseur.nom}
              </h1>
              <StatusBadge
                etatGlobal={ascenseur.etatGlobal}
                sousEtatPanne={ascenseur.sousEtatPanne}
              />
            </div>
            {ascenseur.referenceTechnique && (
              <p className="text-gray-600 mt-2">
                Référence technique: {ascenseur.referenceTechnique}
              </p>
            )}
            {parc && (
              <p className="text-gray-500 mt-1">
                Parc: {parc.nom} - {parc.ville}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions */}
        <div className="lg:col-span-1">
          <AscenseurActions
            ascenseur={ascenseur}
            parcId={ascenseur.parcId}
          />
        </div>

        {/* Historique */}
        <div className="lg:col-span-2">
          <Card title="Historique" subtitle="Chronologie des événements">
            <Timeline evenements={historique} />
          </Card>
        </div>
      </div>
    </div>
  );
}
