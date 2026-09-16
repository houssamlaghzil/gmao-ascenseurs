/**
 * En-tête de navigation période précédente/suivante/aujourd'hui du planning
 * (section 11.1) — composant serveur, de simples liens (même forme que
 * app/maintenances/components/VueCalendrier.tsx).
 */

import Link from 'next/link';
import { CalendarCheck2, ChevronLeft, ChevronRight } from 'lucide-react';

interface EnTetePeriodeProps {
  titre: string;
  hrefPrecedent: string;
  hrefSuivant: string;
  hrefAujourdHui: string;
}

export default function EnTetePeriode({ titre, hrefPrecedent, hrefSuivant, hrefAujourdHui }: EnTetePeriodeProps) {
  return (
    <div className="flex items-center justify-between">
      <Link href={hrefPrecedent} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
      <div className="flex items-center gap-1">
        <Link href={hrefAujourdHui} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Revenir à aujourd'hui">
          <CalendarCheck2 className="h-4 w-4" />
        </Link>
        <Link href={hrefSuivant} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
