import { NextResponse } from 'next/server';
import { getAllAscenseurs, getAllClients, getAllInterventions } from '@/data/store';

/**
 * GET /api/recherche?q=... — recherche globale (section 39) pour la
 * Command Palette. Route serveur pour ne pas charger le jeu de données
 * complet (4348 appareils...) dans le bundle client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  if (q.length < 2) {
    return NextResponse.json({ appareils: [], clients: [], interventions: [] });
  }

  const appareils = getAllAscenseurs()
    .filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.adresseComplete.toLowerCase().includes(q) ||
        a.ville.toLowerCase().includes(q) ||
        a.ficheTechnique.telealarme.numeroCarteLigne?.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((a) => ({ id: a.id, code: a.code, adresse: a.adresseComplete, ville: a.ville }));

  const clients = getAllClients()
    .filter((c) => c.raisonSociale.toLowerCase().includes(q))
    .slice(0, 5)
    .map((c) => ({ id: c.id, nom: c.raisonSociale, ville: c.villeSiege }));

  const interventions = getAllInterventions()
    .filter((i) => i.numero.toLowerCase().includes(q))
    .slice(0, 5)
    .map((i) => ({ id: i.id, numero: i.numero, statut: i.statut }));

  return NextResponse.json({ appareils, clients, interventions });
}
