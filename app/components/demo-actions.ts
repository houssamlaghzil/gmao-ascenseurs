'use server';

import { reinitialiserDonneesDemo } from '@/data/store';

/** Action de maquette uniquement — jamais appelée par un parcours métier. */
export async function reinitialiserDemonstrationAction(): Promise<void> {
  reinitialiserDonneesDemo();
}
