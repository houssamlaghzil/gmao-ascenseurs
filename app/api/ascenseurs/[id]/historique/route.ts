import { NextResponse } from 'next/server';
import { getEvenementsByAscenseurId } from '@/data/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const evenements = getEvenementsByAscenseurId(params.id);

    return NextResponse.json({
      success: true,
      data: evenements,
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
