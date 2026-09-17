/**
 * Enveloppe rejouée à chaque navigation.
 *
 * Contrairement à `layout.tsx`, que Next.js conserve d'une page à l'autre,
 * `template.tsx` est remonté à chaque changement d'URL : le nœud est neuf, donc
 * les animations CSS qu'il porte se relancent seules, sans état ni JavaScript.
 * C'est le seul point d'accroche du routeur qui permette une animation d'entrée
 * sans transformer les pages en composants clients — ce qui, dans cette
 * application, reviendrait à renoncer au rendu serveur des écrans.
 *
 * La cascade vise les petits-enfants (`> * > *`) parce que chaque page rend un
 * conteneur unique qui regroupe ses blocs : ce sont ces blocs qu'on veut voir
 * arriver l'un après l'autre, pas le conteneur.
 */

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="transition-page">{children}</div>;
}
