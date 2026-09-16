import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { EtatConnexionMobile } from '@/domain/types';

/**
 * Bandeau d'état de connexion (sections 18.2/36) — présentatif uniquement,
 * l'état vient de SessionTechnicien.etatConnexion (pas de vraie détection
 * réseau : c'est un scénario figé par technicien de démonstration).
 */
export default function BandeauConnexion({ etat }: { etat: EtatConnexionMobile }) {
  if (etat === EtatConnexionMobile.EN_LIGNE) return null;

  if (etat === EtatConnexionMobile.SYNCHRONISATION_EN_COURS) {
    return (
      <div className="flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-medium px-4 py-2 border-b border-sky-100">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Synchronisation automatique en cours
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-medium px-4 py-2 border-b border-gray-200">
      <WifiOff className="h-3.5 w-3.5" />
      Mode hors ligne
    </div>
  );
}

export function IndicateurConnexionInline({ etat }: { etat: EtatConnexionMobile }) {
  const config = {
    [EtatConnexionMobile.EN_LIGNE]: { icon: Wifi, label: 'En ligne', className: 'text-emerald-600' },
    [EtatConnexionMobile.HORS_LIGNE]: { icon: WifiOff, label: 'Hors ligne', className: 'text-gray-500' },
    [EtatConnexionMobile.SYNCHRONISATION_EN_COURS]: { icon: RefreshCw, label: 'Synchronisation...', className: 'text-sky-600' },
  }[etat];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
