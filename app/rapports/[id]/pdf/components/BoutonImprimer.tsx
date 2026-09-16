'use client';

/**
 * Bouton d'impression de l'aperçu PDF (section 9.3) — window.print() côté
 * client, masqué à l'impression (voir le bloc <style> de la page parente).
 */

import { Printer } from 'lucide-react';

export default function BoutonImprimer() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700"
    >
      <Printer className="h-4 w-4" /> Imprimer
    </button>
  );
}
