/**
 * Garde-fou : aucun import `@/X` ne doit avoir d'homonyme sous `app/X`.
 *
 * L'alias `"@/*": ["./*"]` est transformé par Next.js en chemin absolu
 * (`<racine>/components/StatCard`). Quand la racine du projet est `/app` —
 * ce qui est le cas dans le conteneur, dont le WORKDIR historique était
 * `/app` —, webpack traite ce chemin comme une URL « server-relative » et le
 * re-résout aussi contre `resolve.roots` (= la racine du projet), ce qui donne
 * `/app/app/components/StatCard`. Si ce fichier existe, il gagne : l'import
 * pointe silencieusement sur un autre composant qu'en local, où le chemin
 * absolu (`C:\...`) ne déclenche pas ce mécanisme.
 *
 * C'est ce qui a cassé le tableau de bord en production (`Cannot read
 * properties of undefined (reading 'hover')`) alors que tout fonctionnait en
 * développement. Le WORKDIR de build ne s'appelle plus `/app`, mais ce test
 * interdit en plus de recréer l'ambiguïté à la source.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

const RACINE = path.resolve(__dirname, '..');
const DOSSIERS_SOURCE = ['app', 'components', 'data', 'domain', 'lib'];
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function fichiersSource(dossier: string): string[] {
  const chemin = path.join(RACINE, dossier);
  if (!existsSync(chemin)) return [];
  return readdirSync(chemin).flatMap((entree) => {
    const complet = path.join(chemin, entree);
    if (statSync(complet).isDirectory()) return fichiersSource(path.join(dossier, entree));
    return EXTENSIONS.includes(path.extname(entree)) ? [complet] : [];
  });
}

function importsAlias(fichier: string): string[] {
  const contenu = readFileSync(fichier, 'utf8');
  return [...contenu.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)].map((m) => m[1]);
}

/** Chemins sous `app/` qui rendraient l'import `@/cible` ambigu au build. */
function homonymesSousApp(cible: string): string[] {
  const candidats = [
    ...EXTENSIONS.map((ext) => `app/${cible}${ext}`),
    ...EXTENSIONS.map((ext) => `app/${cible}/index${ext}`),
  ];
  return candidats.filter((candidat) => existsSync(path.join(RACINE, candidat)));
}

describe('résolution des imports @/', () => {
  it('ne laisse aucun import @/X ambigu avec un fichier app/X', () => {
    const collisions = DOSSIERS_SOURCE.flatMap(fichiersSource)
      .flatMap((fichier) =>
        importsAlias(fichier).flatMap((cible) =>
          homonymesSousApp(cible).map((homonyme) => ({
            import: `@/${cible}`,
            attendu: cible,
            ambiguAvec: homonyme,
          })),
        ),
      )
      // Un même import apparaît dans plusieurs fichiers : une seule ligne par collision.
      .filter(
        (collision, index, toutes) =>
          toutes.findIndex((c) => c.ambiguAvec === collision.ambiguAvec) === index,
      );

    expect(collisions).toEqual([]);
  });
});
