import { NextResponse } from 'next/server';
import { 
  getAllAscenseurs, 
  addAscenseur, 
  updateAscenseur, 
  deleteAscenseur,
  moveAscenseurToParc 
} from '@/data/store';
import { Ascenseur, EtatGlobal } from '@/domain/types';

export async function GET() {
  try {
    const ascenseurs = getAllAscenseurs();

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, referenceTechnique, parcId } = body;

    if (!nom || !parcId) {
      return NextResponse.json(
        { success: false, error: 'Nom et parcId sont requis' },
        { status: 400 }
      );
    }

    const newAscenseur: Ascenseur = {
      id: `asc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nom,
      referenceTechnique: referenceTechnique || undefined,
      parcId,
      etatGlobal: EtatGlobal.FONCTIONNEL,
    };

    addAscenseur(newAscenseur);

    return NextResponse.json({
      success: true,
      data: newAscenseur,
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
    const { id, nom, referenceTechnique, parcId } = body;

    if (!id || !nom || !parcId) {
      return NextResponse.json(
        { success: false, error: 'ID, nom et parcId sont requis' },
        { status: 400 }
      );
    }

    // Si c'est juste un changement de parc (drag & drop)
    if (body.action === 'move') {
      moveAscenseurToParc(id, parcId);
      return NextResponse.json({
        success: true,
        data: { id, parcId },
      });
    }

    // Sinon, mise à jour complète
    const updatedAscenseur: Ascenseur = {
      id,
      nom,
      referenceTechnique: referenceTechnique || undefined,
      parcId,
      etatGlobal: body.etatGlobal || EtatGlobal.FONCTIONNEL,
      sousEtatPanne: body.sousEtatPanne,
      technicienAttribueId: body.technicienAttribueId,
    };

    updateAscenseur(updatedAscenseur);

    return NextResponse.json({
      success: true,
      data: updatedAscenseur,
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

    deleteAscenseur(id);

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
