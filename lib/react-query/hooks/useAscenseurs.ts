/**
 * Hooks React Query pour la gestion des ascenseurs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ascenseur, EvenementHistorique } from '@/domain/types';
import {
  CreateAscenseurInput,
  UpdateAscenseurInput,
  MoveAscenseurInput,
  validateData,
  createAscenseurSchema,
  updateAscenseurSchema,
  moveAscenseurSchema,
} from '@/lib/validation/schemas';

// Query keys
export const ascenseurKeys = {
  all: ['ascenseurs'] as const,
  lists: () => [...ascenseurKeys.all, 'list'] as const,
  list: (filters?: string) => [...ascenseurKeys.lists(), filters] as const,
  details: () => [...ascenseurKeys.all, 'detail'] as const,
  detail: (id: string) => [...ascenseurKeys.details(), id] as const,
  historique: (id: string) => [...ascenseurKeys.detail(id), 'historique'] as const,
};

// Fetch functions
const fetchAscenseurs = async (): Promise<Ascenseur[]> => {
  const res = await fetch('/api/ascenseurs');
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération des ascenseurs');
  }
  
  return data.data;
};

const fetchAscenseur = async (id: string): Promise<Ascenseur> => {
  const res = await fetch(`/api/ascenseurs/${id}`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération de l\'ascenseur');
  }
  
  return data.data;
};

const fetchAscenseurHistorique = async (id: string): Promise<EvenementHistorique[]> => {
  const res = await fetch(`/api/ascenseurs/${id}/historique`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération de l\'historique');
  }
  
  return data.data;
};

const createAscenseur = async (input: CreateAscenseurInput): Promise<Ascenseur> => {
  const validation = validateData(createAscenseurSchema, input);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  const res = await fetch('/api/ascenseurs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la création de l\'ascenseur');
  }
  
  return data.data;
};

const updateAscenseur = async (input: UpdateAscenseurInput): Promise<Ascenseur> => {
  const validation = validateData(updateAscenseurSchema, input);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  const res = await fetch('/api/ascenseurs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la mise à jour de l\'ascenseur');
  }
  
  return data.data;
};

const moveAscenseur = async (input: MoveAscenseurInput): Promise<Ascenseur> => {
  const validation = validateData(moveAscenseurSchema, input);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  const res = await fetch('/api/ascenseurs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors du déplacement de l\'ascenseur');
  }
  
  return data.data;
};

const deleteAscenseur = async (id: string): Promise<void> => {
  const res = await fetch('/api/ascenseurs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression de l\'ascenseur');
  }
};

// Hooks
export function useAscenseurs() {
  return useQuery({
    queryKey: ascenseurKeys.lists(),
    queryFn: fetchAscenseurs,
  });
}

export function useAscenseur(id: string) {
  return useQuery({
    queryKey: ascenseurKeys.detail(id),
    queryFn: () => fetchAscenseur(id),
    enabled: !!id,
  });
}

export function useAscenseurHistorique(id: string) {
  return useQuery({
    queryKey: ascenseurKeys.historique(id),
    queryFn: () => fetchAscenseurHistorique(id),
    enabled: !!id,
  });
}

export function useCreateAscenseur() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAscenseur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
    },
  });
}

export function useUpdateAscenseur() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateAscenseur,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.detail(data.id) });
    },
  });
}

export function useMoveAscenseur() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: moveAscenseur,
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ascenseurKeys.lists() });
      
      // Snapshot previous value
      const previousAscenseurs = queryClient.getQueryData<Ascenseur[]>(ascenseurKeys.lists());
      
      // Optimistically update
      if (previousAscenseurs) {
        queryClient.setQueryData<Ascenseur[]>(
          ascenseurKeys.lists(),
          previousAscenseurs.map((asc) =>
            asc.id === variables.id ? { ...asc, parcId: variables.parcId } : asc
          )
        );
      }
      
      return { previousAscenseurs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAscenseurs) {
        queryClient.setQueryData(ascenseurKeys.lists(), context.previousAscenseurs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
    },
  });
}

export function useDeleteAscenseur() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAscenseur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ascenseurKeys.lists() });
    },
  });
}
