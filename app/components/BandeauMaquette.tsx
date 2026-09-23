'use client';

/**
 * Bandeau global rappelant qu'il s'agit d'une maquette (cahier des charges,
 * section 1) : aucune action de cet écran n'a d'effet réel sur un système
 * externe, même quand le libellé emploie un verbe métier ("valider",
 * "envoyer"...).
 *
 * Le bouton de réinitialisation utilise une confirmation navigateur native
 * plutôt qu'une modale dédiée : le dépôt n'a pas de composant de modale
 * générique (cf. conventions UI), et cette action est rare et à haut risque
 * (elle affecte tous les visiteurs actuels de la démo publique) — une
 * confirmation native, bloquante, est suffisante et évite d'introduire un
 * premier composant de modale pour ce seul usage.
 */

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { reinitialiserDemonstrationAction } from './demo-actions';

export default function BandeauMaquette() {
  const [isPending, startTransition] = useTransition();
  const [dernierReset, setDernierReset] = useState<string | null>(null);

  const handleReset = () => {
    const confirme = window.confirm(
      "Réinitialiser la démonstration ? Cette action remet TOUTES les données à leur état initial pour TOUS les visiteurs actuels de la maquette, sans possibilité d'annulation."
    );
    if (!confirme) return;

    startTransition(async () => {
      await reinitialiserDemonstrationAction();
      setDernierReset(new Date().toLocaleTimeString('fr-FR'));
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-800">
      <span>Maquette — données fictives et actions simulées</span>
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="flex items-center gap-1 text-amber-700 hover:text-amber-900 disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        {isPending ? 'Réinitialisation…' : dernierReset ? `Réinitialisé à ${dernierReset}` : 'Réinitialiser la démonstration'}
      </button>
    </div>
  );
}
