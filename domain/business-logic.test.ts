/**
 * Tests unitaires pour la logique métier
 */

import { describe, it, expect } from 'vitest';
import {
  declarerPanne,
  attribuerTechnicien,
  demarrerReparation,
  cloturerReparation,
} from './business-logic';
import {
  Ascenseur,
  Technicien,
  EtatAscenseur,
  SousEtatPanne,
  TypeEvenement,
} from './types';

describe('Logique métier - Transitions d\'état', () => {
  // Données de test
  const ascenseurFonctionnel: Ascenseur = {
    id: 'asc-test-1',
    nom: 'Ascenseur Test 1',
    parcId: 'parc-test',
    etat: EtatAscenseur.FONCTIONNEL,
  };

  const technicienTest: Technicien = {
    id: 'tech-test-1',
    nomComplet: 'Jean Test',
    specialite: 'Tous types',
    disponible: true,
  };

  describe('declarerPanne', () => {
    it('devrait passer un ascenseur fonctionnel en panne', () => {
      const result = declarerPanne(ascenseurFonctionnel, 'Test panne');
      
      expect(result.ascenseur.etat).toBe(EtatAscenseur.EN_PANNE);
      expect(result.ascenseur.sousEtatPanne).toBe(SousEtatPanne.EN_COURS_D_ATTRIBUTION);
      expect(result.ascenseur.technicienAttribueId).toBeUndefined();
      expect(result.evenement.typeEvenement).toBe(TypeEvenement.PANNE_DECLAREE);
      expect(result.evenement.commentaire).toBe('Test panne');
    });

    it('devrait échouer si l\'ascenseur n\'est pas fonctionnel', () => {
      const ascenseurEnPanne: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
      };

      expect(() => declarerPanne(ascenseurEnPanne)).toThrow(
        'Seul un ascenseur fonctionnel peut avoir une panne déclarée'
      );
    });
  });

  describe('attribuerTechnicien', () => {
    it('devrait attribuer un technicien à une panne non attribuée', () => {
      const ascenseurEnPanne: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
        sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
      };

      const result = attribuerTechnicien(
        ascenseurEnPanne,
        technicienTest.id,
        technicienTest
      );

      expect(result.ascenseur.sousEtatPanne).toBe(SousEtatPanne.ATTRIBUE);
      expect(result.ascenseur.technicienAttribueId).toBe(technicienTest.id);
      expect(result.evenement.typeEvenement).toBe(TypeEvenement.PANNE_ATTRIBUEE);
      expect(result.evenement.technicienId).toBe(technicienTest.id);
    });

    it('devrait échouer si l\'ascenseur n\'est pas en panne', () => {
      expect(() =>
        attribuerTechnicien(ascenseurFonctionnel, technicienTest.id, technicienTest)
      ).toThrow('Seul un ascenseur en panne peut avoir un technicien attribué');
    });

    it('devrait échouer si la panne est déjà attribuée', () => {
      const ascenseurDejaAttribue: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
        sousEtatPanne: SousEtatPanne.ATTRIBUE,
        technicienAttribueId: 'tech-autre',
      };

      expect(() =>
        attribuerTechnicien(ascenseurDejaAttribue, technicienTest.id, technicienTest)
      ).toThrow('Cette panne a déjà un technicien attribué');
    });
  });

  describe('demarrerReparation', () => {
    it('devrait démarrer une réparation sur une panne attribuée', () => {
      const ascenseurPanneAttribuee: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
        sousEtatPanne: SousEtatPanne.ATTRIBUE,
        technicienAttribueId: technicienTest.id,
      };

      const result = demarrerReparation(ascenseurPanneAttribuee);

      expect(result.ascenseur.etat).toBe(EtatAscenseur.EN_COURS_DE_REPARATION);
      expect(result.ascenseur.sousEtatPanne).toBeUndefined();
      expect(result.ascenseur.technicienAttribueId).toBe(technicienTest.id);
      expect(result.evenement.typeEvenement).toBe(TypeEvenement.DEBUT_REPARATION);
    });

    it('devrait échouer si l\'ascenseur n\'est pas en panne', () => {
      expect(() => demarrerReparation(ascenseurFonctionnel)).toThrow(
        'Seul un ascenseur en panne peut voir sa réparation démarrée'
      );
    });

    it('devrait échouer si aucun technicien n\'est attribué', () => {
      const ascenseurSansTechnicien: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
        sousEtatPanne: SousEtatPanne.EN_COURS_D_ATTRIBUTION,
      };

      expect(() => demarrerReparation(ascenseurSansTechnicien)).toThrow(
        'Un technicien doit être attribué avant de démarrer la réparation'
      );
    });
  });

  describe('cloturerReparation', () => {
    it('devrait clôturer une réparation et remettre l\'ascenseur en service', () => {
      const ascenseurEnReparation: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_COURS_DE_REPARATION,
        technicienAttribueId: technicienTest.id,
      };

      const result = cloturerReparation(ascenseurEnReparation, 'Réparation OK');

      expect(result.ascenseur.etat).toBe(EtatAscenseur.FONCTIONNEL);
      expect(result.ascenseur.sousEtatPanne).toBeUndefined();
      expect(result.ascenseur.technicienAttribueId).toBeUndefined();
      expect(result.evenements).toHaveLength(2);
      expect(result.evenements[0].typeEvenement).toBe(TypeEvenement.FIN_REPARATION);
      expect(result.evenements[1].typeEvenement).toBe(TypeEvenement.RETOUR_FONCTIONNEL);
    });

    it('devrait échouer si l\'ascenseur n\'est pas en cours de réparation', () => {
      expect(() => cloturerReparation(ascenseurFonctionnel)).toThrow(
        'Seul un ascenseur en cours de réparation peut être clôturé'
      );
    });
  });

  describe('Scénario complet', () => {
    it('devrait gérer un cycle complet panne -> réparation -> fonctionnel', () => {
      let ascenseur: Ascenseur = { ...ascenseurFonctionnel };

      // 1. Déclarer une panne
      const step1 = declarerPanne(ascenseur, 'Panne test');
      ascenseur = step1.ascenseur;
      expect(ascenseur.etat).toBe(EtatAscenseur.EN_PANNE);
      expect(ascenseur.sousEtatPanne).toBe(SousEtatPanne.EN_COURS_D_ATTRIBUTION);

      // 2. Attribuer un technicien
      const step2 = attribuerTechnicien(ascenseur, technicienTest.id, technicienTest);
      ascenseur = step2.ascenseur;
      expect(ascenseur.sousEtatPanne).toBe(SousEtatPanne.ATTRIBUE);
      expect(ascenseur.technicienAttribueId).toBe(technicienTest.id);

      // 3. Démarrer la réparation
      const step3 = demarrerReparation(ascenseur);
      ascenseur = step3.ascenseur;
      expect(ascenseur.etat).toBe(EtatAscenseur.EN_COURS_DE_REPARATION);

      // 4. Clôturer la réparation
      const step4 = cloturerReparation(ascenseur);
      ascenseur = step4.ascenseur;
      expect(ascenseur.etat).toBe(EtatAscenseur.FONCTIONNEL);
      expect(ascenseur.technicienAttribueId).toBeUndefined();
    });
  });

  describe('Transitions impossibles', () => {
    it('ne devrait pas permettre de passer directement de fonctionnel à en_cours_de_reparation', () => {
      expect(() => demarrerReparation(ascenseurFonctionnel)).toThrow();
    });

    it('ne devrait pas permettre de clôturer une panne non réparée', () => {
      const ascenseurEnPanne: Ascenseur = {
        ...ascenseurFonctionnel,
        etat: EtatAscenseur.EN_PANNE,
      };
      expect(() => cloturerReparation(ascenseurEnPanne)).toThrow();
    });
  });
});
