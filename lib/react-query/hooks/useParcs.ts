/**
 * Hooks React Query pour la gestion des parcs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParcAscenseurs } from '@/domain/types';
import { CreateParcInput, UpdateParcInput, validateData, createParcSchema, updateParcSchema } from '@/lib/validation/schemas';

// Query keys
export const parcKeys = {
  all: ['parcs'] as const,
  lists: () => [...parcKeys.all, 'list'] as const,
  list: (filters?: string) => [...parcKeys.lists(), filters] as const,
  details: () => [...parcKeys.all, 'detail'] as const,
  detail: (id: string) => [...parcKeys.details(), id] as const,
};

// Fetch functions
const fetchParcs = async (): Promise<ParcAscenseurs[]> => {
  const res = await fetch('/api/parcs');
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération des parcs');
  }
  
  return data.data;
};

const fetchParc = async (id: string): Promise<ParcAscenseurs> => {
  const res = await fetch(`/api/parcs/${id}`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération du parc');
  }
  
  return data.data;
};

const createParc = async (input: CreateParcInput): Promise<ParcAscenseurs> => {
  // Validate input
  const validation = validateData(createParcSchema, input);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  const res = await fetch('/api/parcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la création du parc');
  }
  
  return data.data;
};

const updateParc = async (input: UpdateParcInput): Promise<ParcAscenseurs> => {
  // Validate input
  const validation = validateData(updateParcSchema, input);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  const res = await fetch('/api/parcs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la mise à jour du parc');
  }
  
  return data.data;
};

const deleteParc = async (id: string): Promise<void> => {
  const res = await fetch('/api/parcs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression du parc');
  }
};

// Hooks
export function useParcs() {
  return useQuery({
    queryKey: parcKeys.lists(),
    queryFn: fetchParcs,
  });
}

export function useParc(id: string) {
  return useQuery({
    queryKey: parcKeys.detail(id),
    queryFn: () => fetchParc(id),
    enabled: !!id,
  });
}

export function useCreateParc() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createParc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parcKeys.lists() });
    },
  });
}

export function useUpdateParc() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateParc,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: parcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parcKeys.detail(data.id) });
    },
  });
}

export function useDeleteParc() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteParc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parcKeys.lists() });
    },
  });
}
