import { NextResponse } from 'next/server';
import { getTechniciensByParcId, countAscenseursEnReparationByTechnicien } from '@/data/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const techniciens = getTechniciensByParcId(params.id);
    
    // Enrichir avec le nombre d'ascenseurs en cours de réparation
    const techniciensWithStats = techniciens.map((tech) => ({
      ...tech,
      nombreReparationsEnCours: countAscenseursEnReparationByTechnicien(tech.id),
    }));

    return NextResponse.json({
      success: true,
      data: techniciensWithStats,
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
