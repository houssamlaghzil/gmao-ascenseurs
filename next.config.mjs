/** @type {import('next').NextConfig} */
const nextConfig = {
  // Activer le mode standalone pour Docker (build optimisé)
  output: 'standalone',
  async headers() {
    return [
      {
        // Maquette de démonstration : jamais indexée par les moteurs de recherche.
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
