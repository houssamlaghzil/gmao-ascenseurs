/**
 * Squelette de chargement du tableau de bord (voir `app/page.tsx`).
 *
 * Le rendu serveur de cet écran prend environ une seconde — Next.js monte ce
 * fichier dès le clic sur la navigation, avant même que le serveur ait
 * commencé à répondre. La structure ci-dessous reprend celle de la page
 * réelle (en-tête, 9 cartes KPI, rangées de graphiques, panneaux) pour
 * qu'aucun élément ne saute de position à l'arrivée du contenu.
 *
 * `.cascade-squelette` fait apparaître les sections l'une après l'autre —
 * c'est le « peu à peu » demandé — et `.bloc-squelette` (embarqué dans
 * `Ligne`) les fait respirer pendant l'attente.
 */

import {
  EnTeteSquelette,
  Ligne,
  Panneau,
  StatutChargement,
  TuileStat,
} from '@/components/skeletons/BlocsSquelette';

export default function Loading() {
  return (
    <>
      <StatutChargement texte="Chargement du tableau de bord en cours" />

      <div className="space-y-8 cascade-squelette">
        <EnTeteSquelette largeurTitre="w-64" lignesSousTitre={1} />

        {/* 3.1 — grille de 9 cartes KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <TuileStat key={i} />
          ))}
        </div>

        {/* 3.2 — jauges et anneaux */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Panneau key={i} avecEntete largeurTitre="w-32" largeurSousTitre="w-40">
              <div aria-hidden className="flex flex-col items-center gap-3">
                <Ligne className="h-28 w-28 rounded-full" />
                <Ligne className="h-3 w-32" />
              </div>
            </Panneau>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Panneau key={i} avecEntete largeurTitre="w-32" largeurSousTitre="w-48">
              <div aria-hidden className="flex flex-col items-center gap-3">
                <Ligne className="h-40 w-40 rounded-full" />
                <Ligne className="h-3 w-32" />
              </div>
            </Panneau>
          ))}
        </div>

        {/* Activité 90 jours + charge par technicien */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panneau avecEntete largeurTitre="w-48" largeurSousTitre="w-64" className="lg:col-span-2">
            <div aria-hidden className="space-y-2">
              <div className="flex gap-1 pl-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Ligne key={i} className="h-3 w-[52px]" />
                ))}
              </div>
              <div className="flex gap-1">
                <div className="flex flex-col gap-[3px] pr-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Ligne key={i} className="h-3 w-3" />
                  ))}
                </div>
                <div className="flex gap-[3px]">
                  {Array.from({ length: 13 }).map((_, w) => (
                    <div key={w} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }).map((_, d) => (
                        <Ligne key={d} className="h-3 w-3 rounded-sm" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panneau>
          <Panneau avecEntete largeurTitre="w-40" largeurSousTitre="w-48">
            <div aria-hidden className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Ligne className="h-3 w-24" />
                    <Ligne className="h-3 w-6" />
                  </div>
                  <Ligne className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Panneau>
        </div>

        {/* 3.3 — Urgences */}
        <Panneau avecEntete largeurTitre="w-40">
          <div aria-hidden className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Ligne key={i} className="h-12 w-full" />
            ))}
          </div>
        </Panneau>

        {/* 3.4 — Activité récente + maintenance prédictive */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Panneau key={i} avecEntete largeurTitre="w-44">
              <div aria-hidden className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Ligne key={j} className="h-10 w-full" />
                ))}
              </div>
            </Panneau>
          ))}
        </div>
      </div>
    </>
  );
}
