import { NextResponse } from 'next/server';
import {
  getAscenseurById,
  getTechnicienById,
  updateAscenseur,
  addEvenement,
  addEvenements,
} from '@/data/store';
import {
  declarerPanne,
  attribuerTechnicien,
  demarrerReparation,
  cloturerReparation,
} from '@/domain/business-logic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, technicienId, commentaire } = body;

    const ascenseur = getAscenseurById(params.id);
    if (!ascenseur) {
      return NextResponse.json(
        { success: false, error: 'Ascenseur non trouvé' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'declarer_panne': {
        const result = declarerPanne(ascenseur, commentaire);
        updateAscenseur(result.ascenseur);
        addEvenement(result.evenement);
        return NextResponse.json({
          success: true,
          data: result.ascenseur,
        });
      }

      case 'attribuer_technicien': {
        if (!technicienId) {
          return NextResponse.json(
            { success: false, error: 'technicienId requis' },
            { status: 400 }
          );
        }
        const technicien = getTechnicienById(technicienId);
        if (!technicien) {
          return NextResponse.json(
            { success: false, error: 'Technicien non trouvé' },
            { status: 404 }
          );
        }
        const result = attribuerTechnicien(ascenseur, technicienId, technicien);
        updateAscenseur(result.ascenseur);
        addEvenement(result.evenement);
        return NextResponse.json({
          success: true,
          data: result.ascenseur,
        });
      }

      case 'demarrer_reparation': {
        const result = demarrerReparation(ascenseur);
        updateAscenseur(result.ascenseur);
        addEvenement(result.evenement);
        return NextResponse.json({
          success: true,
          data: result.ascenseur,
        });
      }

      case 'cloturer_reparation': {
        const result = cloturerReparation(ascenseur, commentaire);
        updateAscenseur(result.ascenseur);
        addEvenements(result.evenements);
        return NextResponse.json({
          success: true,
          data: result.ascenseur,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }
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
