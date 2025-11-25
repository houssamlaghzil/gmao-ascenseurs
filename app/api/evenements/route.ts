import { NextResponse } from 'next/server';
import { getRecentEvenements } from '@/data/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const evenements = getRecentEvenements(limit);

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
