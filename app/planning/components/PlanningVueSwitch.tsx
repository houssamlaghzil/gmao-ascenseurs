'use client';

/**
 * Bascule jour / semaine / mois du planning (section 11.1). Chaque bouton
 * navigue vers l'URL correspondante (query param `vue`, déjà calculée côté
 * serveur pour préserver les autres filtres) : app/planning/page.tsx ne
 * projette que la vue active à chaque requête (voir le commentaire en tête
 * de ce fichier), donc changer de vue redemande sciemment au serveur la
 * fenêtre de dates correspondante plutôt que de bricoler un état purement
 * client sur des données déjà tronquées.
 */

import Link from 'next/link';

type Vue = 'jour' | 'semaine' | 'mois';

interface PlanningVueSwitchProps {
  vue: Vue;
  hrefJour: string;
  hrefSemaine: string;
  hrefMois: string;
}

export default function PlanningVueSwitch({ vue, hrefJour, hrefSemaine, hrefMois }: PlanningVueSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-md p-1">
      <BoutonVue label="Jour" href={hrefJour} actif={vue === 'jour'} />
      <BoutonVue label="Semaine" href={hrefSemaine} actif={vue === 'semaine'} />
      <BoutonVue label="Mois" href={hrefMois} actif={vue === 'mois'} />
    </div>
  );
}

function BoutonVue({ label, href, actif }: { label: string; href: string; actif: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        actif ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );
}
