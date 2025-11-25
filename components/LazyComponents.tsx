/**
 * Lazy-loaded components pour optimiser le bundle initial
 * Réduit le temps de chargement initial de l'application
 */

import { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load des modales (chargées uniquement quand nécessaires)
export const LazyParcModal = lazy(() => import('@/app/gestion/components/ParcModal'));
export const LazyAscenseurModal = lazy(() => import('@/app/gestion/components/AscenseurModal'));

// Wrapper avec Suspense pour gérer le chargement
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// HOC pour faciliter le lazy loading de n'importe quel composant
export function withLazy<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
  
  LazyComponent.displayName = `withLazy(${Component.displayName || Component.name || 'Component'})`;
  
  return LazyComponent;
}
