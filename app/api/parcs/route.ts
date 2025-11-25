import { NextResponse } from 'next/server';
import { getAllParcs, getAllStatistiques, addParc, updateParc, deleteParc } from '@/data/store';
import { ParcAscenseurs, TypeParc } from '@/domain/types';

export async function GET() {
  try {
    const parcs = getAllParcs();
    const statistiques = getAllStatistiques();
    
    // Enrichir les parcs avec leurs statistiques
    const parcsWithStats = parcs.map((parc) => ({
      ...parc,
      stats: statistiques.find((s) => s.parcId === parc.id),
    }));

    return NextResponse.json({
      success: true,
      data: parcsWithStats,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, description, ville, adresse } = body;

    if (!nom || !ville) {
      return NextResponse.json(
        { success: false, error: 'Nom et ville sont requis' },
        { status: 400 }
      );
    }

    const newParc: ParcAscenseurs = {
      id: `parc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nom,
      description: description || '',
      ville,
      adresse: adresse || '',
      type: TypeParc.COMMERCIAL, // Type par défaut
    };

    addParc(newParc);

    return NextResponse.json({
      success: true,
      data: newParc,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nom, description, ville, adresse } = body;

    if (!id || !nom || !ville) {
      return NextResponse.json(
        { success: false, error: 'ID, nom et ville sont requis' },
        { status: 400 }
      );
    }

    const updatedParc: ParcAscenseurs = {
      id,
      nom,
      description: description || '',
      ville,
      adresse: adresse || '',
      type: body.type || TypeParc.COMMERCIAL,
    };

    updateParc(updatedParc);

    return NextResponse.json({
      success: true,
      data: updatedParc,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    deleteParc(id);

    return NextResponse.json({
      success: true,
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
