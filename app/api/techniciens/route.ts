import { NextResponse } from 'next/server';
import { getAllTechniciens } from '@/data/store';

/**
 * GET /api/techniciens
 * Retourne tous les techniciens
 */
export async function GET() {
  try {
    const techniciens = getAllTechniciens();

    return NextResponse.json({
      success: true,
      data: techniciens,
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
