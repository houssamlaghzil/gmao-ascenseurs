/**
 * Composant Skeleton pour les cartes
 * Améliore la perception du temps de chargement
 */

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}
