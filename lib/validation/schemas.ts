/**
 * Schémas Zod pour la validation des données
 * Assure la cohérence des données entre client et serveur
 */

import { z } from 'zod';
import {
  EtatGlobal,
  SousEtatPanne,
  TypeEvenement,
  RiskLevel,
  TypeParc,
} from '@/domain/types';

// ========== SCHÉMAS ENUMS ==========

export const etatGlobalSchema = z.nativeEnum(EtatGlobal);
export const sousEtatPanneSchema = z.nativeEnum(SousEtatPanne);
export const typeEvenementSchema = z.nativeEnum(TypeEvenement);
export const riskLevelSchema = z.nativeEnum(RiskLevel);
export const typeParcSchema = z.nativeEnum(TypeParc);

// ========== SCHÉMAS ENTITÉS ==========

export const parcSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().max(500, 'La description est trop longue'),
  ville: z.string().min(1, 'La ville est requise').max(100, 'La ville est trop longue'),
  adresse: z.string().min(1, 'L\'adresse est requise').max(200, 'L\'adresse est trop longue'),
  type: typeParcSchema,
});

export const ascenseurSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  referenceTechnique: z.string().max(50, 'La référence est trop longue').optional(),
  parcId: z.string().min(1, 'Le parc est requis'),
  etatGlobal: etatGlobalSchema,
  sousEtatPanne: sousEtatPanneSchema.optional(),
  technicienAttribueId: z.string().optional(),
});

export const technicienSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  nomComplet: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  specialite: z.string().min(1, 'La spécialité est requise').max(100, 'La spécialité est trop longue'),
  disponible: z.boolean(),
});

export const evenementHistoriqueSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  ascenseurId: z.string().min(1, 'L\'ID de l\'ascenseur est requis'),
  typeEvenement: typeEvenementSchema,
  dateHeure: z.string().datetime('Date invalide'),
  commentaire: z.string().max(1000, 'Le commentaire est trop long').optional(),
  technicienId: z.string().optional(),
});

// ========== SCHÉMAS DE FORMULAIRES ==========

export const createParcSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().max(500, 'La description est trop longue'),
  ville: z.string().min(1, 'La ville est requise').max(100, 'La ville est trop longue'),
  adresse: z.string().min(1, 'L\'adresse est requise').max(200, 'L\'adresse est trop longue'),
});

export const updateParcSchema = createParcSchema.extend({
  id: z.string().min(1, 'ID requis'),
});

export const createAscenseurSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  referenceTechnique: z.string().max(50, 'La référence est trop longue').optional(),
  parcId: z.string().min(1, 'Le parc est requis'),
});

export const updateAscenseurSchema = createAscenseurSchema.extend({
  id: z.string().min(1, 'ID requis'),
});

export const moveAscenseurSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  parcId: z.string().min(1, 'Le parc est requis'),
  action: z.literal('move'),
});

export const declarerPanneSchema = z.object({
  commentaire: z.string().min(1, 'Le commentaire est requis').max(1000, 'Le commentaire est trop long'),
});

export const attribuerTechnicienSchema = z.object({
  technicienId: z.string().min(1, 'Le technicien est requis'),
});

// ========== SCHÉMAS DE RÉPONSES API ==========

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// Validation helpers
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError?.message || 'Validation failed' };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// ========== TYPES INFÉRÉS ==========

export type CreateParcInput = z.infer<typeof createParcSchema>;
export type UpdateParcInput = z.infer<typeof updateParcSchema>;
export type CreateAscenseurInput = z.infer<typeof createAscenseurSchema>;
export type UpdateAscenseurInput = z.infer<typeof updateAscenseurSchema>;
export type MoveAscenseurInput = z.infer<typeof moveAscenseurSchema>;
export type DeclarerPanneInput = z.infer<typeof declarerPanneSchema>;
export type AttribuerTechnicienInput = z.infer<typeof attribuerTechnicienSchema>;
