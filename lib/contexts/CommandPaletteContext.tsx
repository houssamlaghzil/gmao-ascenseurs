'use client';

/**
 * État de la palette de recherche, partagé par la barre latérale (qui porte le
 * bouton déclencheur) et par la palette elle-même.
 *
 * Le contexte transporte aussi l'**ancre** : l'élément depuis lequel la palette
 * doit paraître surgir. La barre latérale enregistre son bouton « Rechercher »,
 * et la palette mesure cet élément à l'ouverture pour se déplier depuis sa
 * position exacte. C'est ce qui rend le mouvement crédible : la surface ne
 * surgit pas de nulle part, elle vient d'où l'utilisateur a cliqué — et le
 * raccourci clavier produit le même mouvement, puisque l'ancre ne dépend pas
 * du geste qui a ouvert la palette.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, MutableRefObject, ReactNode } from 'react';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Référence vers le bouton déclencheur, renseignée par la barre latérale. */
  ancreRef: MutableRefObject<HTMLElement | null>;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ancreRef = useRef<HTMLElement | null>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const valeur = useMemo(() => ({ open, setOpen, toggle, ancreRef }), [open, toggle]);

  return <CommandPaletteContext.Provider value={valeur}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}
