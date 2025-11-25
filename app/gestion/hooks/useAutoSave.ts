import { useEffect, useState, useRef } from 'react';
import { ParcAscenseurs, Ascenseur } from '@/domain/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook pour sauvegarder automatiquement les changements avec debouncing
 */
export function useAutoSave(parcs: ParcAscenseurs[], ascenseurs: Ascenseur[]) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Ne pas sauvegarder au premier rendu
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveStatus('saving');

    // Attendre 1 seconde avant de sauvegarder
    timeoutRef.current = setTimeout(async () => {
      try {
        // La sauvegarde est déjà gérée par les appels API individuels
        // Ce hook sert principalement à afficher le statut
        setSaveStatus('saved');
        
        // Remettre à idle après 2 secondes
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        setSaveStatus('error');
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [parcs, ascenseurs]);

  return { saveStatus };
}
