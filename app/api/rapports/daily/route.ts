import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAllParcs, getAllStatistiquesParc, getAllInterventions } from '@/data/store';

export async function POST(request: Request) {
  try {
    // Initialiser OpenAI à la demande pour éviter les erreurs au build si la clé n'est pas définie
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY manquante côté serveur' },
        { status: 500 }
      );
    }
    const openai = new OpenAI({ apiKey });

    const { date } = await request.json();
    const reportDate = date || new Date().toISOString().split('T')[0];
    const today = new Date(reportDate);

    const parcs = getAllParcs();
    const statistiques = getAllStatistiquesParc();

    // Interventions ouvertes ou clôturées aujourd'hui
    const interventionsDuJour = getAllInterventions().filter((i) => {
      const creeAujourdhui = new Date(i.dateCreation).toDateString() === today.toDateString();
      const clotureeAujourdhui = i.dateCloture && new Date(i.dateCloture).toDateString() === today.toDateString();
      return creeAujourdhui || clotureeAujourdhui;
    });

    const statsGlobales = statistiques.reduce(
      (acc, stat) => ({
        totalAscenseurs: acc.totalAscenseurs + stat.totalAscenseurs,
        nombreEnService: acc.nombreEnService + stat.nombreEnService,
        nombreEnPanne: acc.nombreEnPanne + stat.nombreEnPanne,
        nombreALArret: acc.nombreALArret + stat.nombreALArret,
        nombreModeDegrade: acc.nombreModeDegrade + stat.nombreModeDegrade,
        nombreArretTravaux: acc.nombreArretTravaux + stat.nombreArretTravaux,
      }),
      {
        totalAscenseurs: 0,
        nombreEnService: 0,
        nombreEnPanne: 0,
        nombreALArret: 0,
        nombreModeDegrade: 0,
        nombreArretTravaux: 0,
      }
    );

    const prompt = `Tu es un assistant IA spécialisé en GMAO (Gestion de Maintenance Assistée par Ordinateur) pour les ascenseurs.

Génère un rapport journalier détaillé et professionnel pour le ${reportDate}.

**Données globales:**
- Nombre total de parcs: ${parcs.length}
- Nombre total d'appareils: ${statsGlobales.totalAscenseurs}
- En service: ${statsGlobales.nombreEnService}
- En panne: ${statsGlobales.nombreEnPanne}
- À l'arrêt: ${statsGlobales.nombreALArret}
- En mode dégradé: ${statsGlobales.nombreModeDegrade}
- En arrêt travaux: ${statsGlobales.nombreArretTravaux}

**Interventions du jour (${interventionsDuJour.length}):**
${interventionsDuJour.map((i) => `- ${i.numero} — ${i.motif} (statut: ${i.statut})`).join('\n') || '- Aucune intervention créée ou clôturée aujourd\'hui'}

**Statistiques par parc:**
${statistiques
  .map((s) => {
    const parc = parcs.find((p) => p.id === s.parcId);
    return `- ${parc?.nom} (${parc?.ville}): ${s.totalAscenseurs} appareils (${s.nombreEnService} en service, ${s.nombreEnPanne} en panne, ${s.nombreModeDegrade} en mode dégradé)`;
  })
  .join('\n')}

Le rapport doit contenir:
1. Un résumé exécutif
2. Une analyse de la performance globale
3. Les points d'attention et alertes
4. Les recommandations d'actions
5. Une conclusion

Format le rapport en Markdown avec des sections claires. Sois concis mais informatif.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            "Tu es un expert en maintenance d'ascenseurs et en analyse de données GMAO. Tu génères des rapports professionnels, clairs et actionnables.",
        },
        { role: 'user', content: prompt },
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
        interventionsCount: interventionsDuJour.length,
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
