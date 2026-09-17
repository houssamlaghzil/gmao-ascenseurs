/**
 * Ancienne adresse de la fiche appareil — conservée uniquement pour ne casser
 * aucun lien existant (carte, interventions, maintenances, CTQ, techniciens,
 * palette de commandes, favoris des utilisateurs…).
 *
 * Le vocabulaire a été tranché : `/parc` est la liste des *appareils*, alors
 * qu'un `ParcAscenseurs` est un *site*. Servir la fiche d'un appareil sous
 * `/parc/<id>` entretenait la confusion ; l'adresse canonique est désormais
 * `/appareils/<id>` (voir app/appareils/[id]/page.tsx).
 *
 * Les sept onglets restent dans app/parc/[id]/components/ : ils sont importés
 * par la nouvelle fiche, pas dupliqués.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface AncienneFicheAppareilPageProps {
  params: { id: string };
}

export default function AncienneFicheAppareilPage({ params }: AncienneFicheAppareilPageProps) {
  redirect(`/appareils/${params.id}`);
}
