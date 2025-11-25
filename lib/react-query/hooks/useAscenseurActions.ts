/**
 * Hooks React Query pour les actions sur les ascenseurs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ascenseur } from '@/domain/types';
import { ascenseurKeys } from './useAscenseurs';
import { DeclarerPanneInput, AttribuerTechnicienInput, validateData, declarerPanneSchema, attribuerTechnicienSchema } from '@/lib/validation/schemas';

interface ActionPayload {
  action: string;
  [key: string]: any;
}

const executeAction = async (ascenseurId: string, payload: ActionPayload): Promise<Ascenseur> => {
  const res = await fetch(`/api/ascenseurs/${ascenseurId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de l\'action');
  }
  
  return data.data;
};

export function useDeclarerPanne(ascenseurId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: DeclarerPanneInput) => {
      const validation = validateData(declarerPanneSchema, input);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      
      return executeAction(ascenseurId, {
        action: 'declarer_panne',
        ...validation.data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.historique(data.id) });
    },
  });
}

export function useAttribuerTechnicien(ascenseurId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AttribuerTechnicienInput) => {
      const validation = validateData(attribuerTechnicienSchema, input);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      
      return executeAction(ascenseurId, {
        action: 'attribuer_technicien',
        ...validation.data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.historique(data.id) });
    },
  });
}

export function useDebuterReparation(ascenseurId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return executeAction(ascenseurId, { action: 'debuter_reparation' });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.historique(data.id) });
    },
  });
}

export function useTerminerReparation(ascenseurId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return executeAction(ascenseurId, { action: 'terminer_reparation' });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.historique(data.id) });
    },
  });
}
