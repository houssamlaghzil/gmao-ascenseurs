import { NextResponse } from 'next/server';
import { getAscenseurById } from '@/data/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ascenseur = getAscenseurById(params.id);
    
    if (!ascenseur) {
      return NextResponse.json(
        { success: false, error: 'Ascenseur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ascenseur,
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
