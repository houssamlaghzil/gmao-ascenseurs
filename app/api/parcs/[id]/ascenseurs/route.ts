import { NextResponse } from 'next/server';
import { getAscenseursByParcId } from '@/data/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ascenseurs = getAscenseursByParcId(params.id);

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
