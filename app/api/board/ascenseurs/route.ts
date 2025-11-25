import { NextResponse } from 'next/server';
import { getAllAscenseursWithRisk } from '@/data/store';

/**
 * GET /api/board/ascenseurs
 * Retourne tous les ascenseurs avec leur score de risque pour le board
 */
export async function GET() {
  try {
    const ascenseurs = getAllAscenseursWithRisk();

    return NextResponse.json({
      success: true,
      data: ascenseurs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
