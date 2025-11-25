/**
 * Composant Skeleton pour les colonnes du board Kanban
 */

export default function SkeletonBoardColumn() {
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-w-[300px]">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
