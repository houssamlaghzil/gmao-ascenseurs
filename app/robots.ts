import type { MetadataRoute } from 'next';

// Maquette de démonstration : ne doit pas être indexée par les moteurs de recherche.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
