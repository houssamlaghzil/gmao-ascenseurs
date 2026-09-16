/**
 * Sentinelle partagée entre ClotureWizard.tsx (client) et actions.ts (Server
 * Action) pour le choix de clôture "Pas d'accès" (section 27) — voir la note
 * d'écart dans actions.ts. Isolée dans son propre module car un fichier
 * 'use server' ne peut exporter que des fonctions async : cette constante ne
 * peut donc pas vivre directement dans actions.ts.
 */
export const PAS_ACCES = 'pas_acces' as const;
