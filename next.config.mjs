/** @type {import('next').NextConfig} */
const nextConfig = {
  // Activer le mode standalone pour Docker (build optimisé)
  output: 'standalone',
};

export default nextConfig;
