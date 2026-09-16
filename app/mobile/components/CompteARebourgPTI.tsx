'use client';

/**
 * Compte à rebours de réactivation PTI/DATI (section 38,
 * EtatProtectionPTI.REACTIVATION_EN_COMPTE_A_REBOURS). Purement présentatif
 * (tick local à l'affichage) ; une fois `finCompteARebours` atteint, appelle
 * une seule fois `definirEtatPTI(..., PROTECTION_ACTIVE)` pour clore
 * automatiquement la réactivation, puis rafraîchit la page courante.
 */

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EtatProtectionPTI } from '@/domain/types';
import { definirEtatPTI } from './pti-actions';

export default function CompteARebourgPTI({
  technicienId,
  finCompteARebours,
}: {
  technicienId: string;
  finCompteARebours: string;
}) {
  const router = useRouter();
  const cibleMs = new Date(finCompteARebours).getTime();
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [finaliseDemande, setFinaliseDemande] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const intervalle = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(intervalle);
  }, []);

  const restantSecondes = Math.max(0, Math.ceil((cibleMs - maintenant) / 1000));

  useEffect(() => {
    if (restantSecondes === 0 && !finaliseDemande) {
      setFinaliseDemande(true);
      startTransition(async () => {
        await definirEtatPTI(technicienId, EtatProtectionPTI.PROTECTION_ACTIVE);
        router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restantSecondes, finaliseDemande]);

  const minutes = Math.floor(restantSecondes / 60);
  const secondes = restantSecondes % 60;

  return (
    <div className="mt-2 rounded-md bg-white/70 px-3 py-2 text-center">
      <p className="font-mono text-lg font-semibold tabular-nums text-sky-800">
        {String(minutes).padStart(2, '0')}:{String(secondes).padStart(2, '0')}
      </p>
      <p className="text-[11px] text-sky-700">
        {restantSecondes > 0 || isPending ? 'avant réactivation complète de la protection' : 'Protection réactivée'}
      </p>
    </div>
  );
}
