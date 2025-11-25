import { NextResponse } from 'next/server';
import { getParcById, getStatistiquesParc } from '@/data/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parc = getParcById(params.id);
    
    if (!parc) {
      return NextResponse.json(
        { success: false, error: 'Parc non trouvé' },
        { status: 404 }
      );
    }

    const stats = getStatistiquesParc(params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...parc,
        stats,
      },
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
