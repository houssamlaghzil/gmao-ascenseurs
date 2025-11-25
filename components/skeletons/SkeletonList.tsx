/**
 * Composant Skeleton pour les listes
 */

import SkeletonCard from './SkeletonCard';

interface SkeletonListProps {
  count?: number;
}

export default function SkeletonList({ count = 3 }: SkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
