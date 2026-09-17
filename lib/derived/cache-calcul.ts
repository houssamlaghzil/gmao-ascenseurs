// lib/derived/cache-calcul.ts
/**
 * Cache de calcul entre requêtes — complète le `cache()` de React (qui ne
 * dédoublonne QUE dans une requête) par une mémoïsation qui survit ENTRE les
 * requêtes, tant que la version des données n'a pas changé. Purement du
 * JavaScript (Map + compteur), sans dépendance à `unstable_cache` — voir
 * docs/superpowers/specs/2026-09-17-cache-calcul-et-rendu-design.md.
 *
 * `obtenirVersion` est injecté (pas d'import de data/store ici) : chaque
 * primitive est testable isolément, sans mock du magasin de données.
 */

interface EntreeVersion<R> {
  version: number;
  valeur: R;
}

interface EntreeVersionEtMinute<R> extends EntreeVersion<R> {
  minute: number;
}

const CLE_PAR_DEFAUT = (): string => '';

/**
 * Mémoïse `calcul` tant que `obtenirVersion()` ne change pas. À utiliser pour
 * tout résultat qui ne dépend QUE des données du magasin (pas de l'heure
 * courante).
 */
export function memoiserSurVersion<A extends unknown[], R>(
  obtenirVersion: () => number,
  calcul: (...args: A) => R,
  cleArgs: (...args: A) => string = CLE_PAR_DEFAUT as (...args: A) => string
): (...args: A) => R {
  const cache = new Map<string, EntreeVersion<R>>();
  return (...args: A): R => {
    const version = obtenirVersion();
    const cle = cleArgs(...args);
    const entree = cache.get(cle);
    if (entree && entree.version === version) return entree.valeur;
    const valeur = calcul(...args);
    cache.set(cle, { version, valeur });
    return valeur;
  };
}

/**
 * Identique à `memoiserSurVersion`, avec en plus une granularité d'une
 * minute : à utiliser pour tout résultat qui dépend aussi de l'heure
 * courante (ex. dépassement de SLA, fenêtre glissante « 30 derniers jours »
 * du score de risque). Sans incidence perceptible sur une démo — réduit déjà
 * le recalcul d'« à chaque requête » à « au plus une fois par minute ».
 */
export function memoiserSurVersionEtMinute<A extends unknown[], R>(
  obtenirVersion: () => number,
  calcul: (...args: A) => R,
  cleArgs: (...args: A) => string = CLE_PAR_DEFAUT as (...args: A) => string
): (...args: A) => R {
  const cache = new Map<string, EntreeVersionEtMinute<R>>();
  return (...args: A): R => {
    const version = obtenirVersion();
    const minute = Math.floor(Date.now() / 60_000);
    const cle = cleArgs(...args);
    const entree = cache.get(cle);
    if (entree && entree.version === version && entree.minute === minute) return entree.valeur;
    const valeur = calcul(...args);
    cache.set(cle, { version, minute, valeur });
    return valeur;
  };
}
