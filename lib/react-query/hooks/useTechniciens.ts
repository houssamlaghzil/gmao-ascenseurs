/**
 * Hooks React Query pour la gestion des techniciens
 */

import { useQuery } from '@tanstack/react-query';
import { Technicien } from '@/domain/types';

// Query keys
export const technicienKeys = {
  all: ['techniciens'] as const,
  lists: () => [...technicienKeys.all, 'list'] as const,
  byParc: (parcId: string) => [...technicienKeys.lists(), 'parc', parcId] as const,
};

// Fetch functions
const fetchTechniciens = async (): Promise<Technicien[]> => {
  const res = await fetch('/api/techniciens');
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération des techniciens');
  }
  
  return data.data;
};

const fetchTechniciensByParc = async (parcId: string): Promise<Technicien[]> => {
  const res = await fetch(`/api/parcs/${parcId}/techniciens`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la récupération des techniciens du parc');
  }
  
  return data.data;
};

// Hooks
export function useTechniciens() {
  return useQuery({
    queryKey: technicienKeys.lists(),
    queryFn: fetchTechniciens,
  });
}

export function useTechniciensByParc(parcId: string) {
  return useQuery({
    queryKey: technicienKeys.byParc(parcId),
    queryFn: () => fetchTechniciensByParc(parcId),
    enabled: !!parcId,
  });
}
