/**
 * Fonctions utilitaires
 */

/**
 * Formate une date en temps relatif (il y a X minutes/heures/jours)
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  } else if (diffHour > 0) {
    return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  } else if (diffMin > 0) {
    return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  } else {
    return 'À l\'instant';
  }
}

/**
 * Formate une date au format français lisible
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Classe utilitaire pour combiner des classes CSS conditionnellement
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
