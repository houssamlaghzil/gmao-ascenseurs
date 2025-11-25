import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  getAllParcs, 
  getAllAscenseurs, 
  getRecentEvenements,
  getAllStatistiques 
} from '@/data/store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    const reportDate = date || new Date().toISOString().split('T')[0];

    // Récupérer toutes les données
    const parcs = getAllParcs();
    const ascenseurs = getAllAscenseurs();
    const evenements = getRecentEvenements(50);
    const statistiques = getAllStatistiques();

    // Filtrer les événements du jour
    const today = new Date(reportDate);
    const todayEvents = evenements.filter((e) => {
      const eventDate = new Date(e.dateHeure);
      return eventDate.toDateString() === today.toDateString();
    });

    // Préparer les données pour OpenAI
    const statsGlobales = statistiques.reduce(
      (acc, stat) => ({
        totalAscenseurs: acc.totalAscenseurs + stat.totalAscenseurs,
        nombreFonctionnels: acc.nombreFonctionnels + stat.nombreFonctionnels,
        nombreEnPanne: acc.nombreEnPanne + stat.nombreEnPanne,
        nombreEnReparation: acc.nombreEnReparation + stat.nombreEnReparation,
      }),
      {
        totalAscenseurs: 0,
        nombreFonctionnels: 0,
        nombreEnPanne: 0,
        nombreEnReparation: 0,
      }
    );

    const prompt = `Tu es un assistant IA spécialisé en GMAO (Gestion de Maintenance Assistée par Ordinateur) pour les ascenseurs.

Génère un rapport journalier détaillé et professionnel pour le ${reportDate}.

**Données globales:**
- Nombre total de parcs: ${parcs.length}
- Nombre total d'ascenseurs: ${statsGlobales.totalAscenseurs}
- Ascenseurs fonctionnels: ${statsGlobales.nombreFonctionnels}
- Ascenseurs en panne: ${statsGlobales.nombreEnPanne}
- Ascenseurs en réparation: ${statsGlobales.nombreEnReparation}

**Événements du jour (${todayEvents.length}):**
${todayEvents.map((e) => `- ${e.typeEvenement} (${e.dateHeure}): ${e.commentaire || 'N/A'}`).join('\n')}

**Statistiques par parc:**
${statistiques.map((s) => {
  const parc = parcs.find((p) => p.id === s.parcId);
  return `- ${parc?.nom} (${parc?.ville}): ${s.totalAscenseurs} ascenseurs (${s.nombreFonctionnels} OK, ${s.nombreEnPanne} en panne, ${s.nombreEnReparation} en réparation)`;
}).join('\n')}

Le rapport doit contenir:
1. Un résumé exécutif
2. Une analyse de la performance globale
3. Les points d'attention et alertes
4. Les recommandations d'actions
5. Une conclusion

Format le rapport en Markdown avec des sections claires. Sois concis mais informatif.`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en maintenance d\'ascenseurs et en analyse de données GMAO. Tu génères des rapports professionnels, clairs et actionnables.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const rapport = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      data: {
        date: reportDate,
        rapport,
        statistiques: statsGlobales,
        evenementsCount: todayEvents.length,
      },
    });
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la génération du rapport',
      },
      { status: 500 }
    );
  }
}
