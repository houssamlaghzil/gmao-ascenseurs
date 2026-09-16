/**
 * Liste des contrats (section 14). Server Component : lecture directe du
 * store, enrichie du nom du client et du décompte réel d'appareils couverts
 * (getAscenseursByContratId), volontairement comparé à la valeur
 * contractuelle déclarée (nombreAppareilsCouverts) — un écart entre les deux
 * est une situation normale des données de démo, affichée plutôt que masquée.
 */

import { FileSignature } from 'lucide-react';
import { getAllContrats, getAscenseursByContratId, getClientById } from '@/data/store';
import TableauContrats, { type LigneContrat } from './components/TableauContrats';

export const dynamic = 'force-dynamic';

export default function ContratsPage() {
  const lignes: LigneContrat[] = getAllContrats()
    .map((contrat) => ({
      contrat,
      clientNom: getClientById(contrat.clientId)?.raisonSociale ?? 'Client inconnu',
      nombreAppareilsReel: getAscenseursByContratId(contrat.id).length,
    }))
    .sort((a, b) => a.clientNom.localeCompare(b.clientNom));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSignature className="h-6 w-6 text-blue-600" />
          Contrats
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {lignes.length.toLocaleString('fr-FR')} contrat{lignes.length > 1 ? 's' : ''} au total
        </p>
      </div>

      <TableauContrats lignes={lignes} />
    </div>
  );
}
