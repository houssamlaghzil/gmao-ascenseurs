/**
 * Cadre téléphone pour la simulation de l'application mobile technicien
 * (le périmètre principal du cahier des charges est Android, section 42).
 * Purement présentatif : encadre les écrans /mobile/** dans un rendu qui se
 * lit immédiatement comme une app mobile au sein de la démo web.
 */

import { ReactNode } from 'react';
import { Wifi, BatteryFull } from 'lucide-react';

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 py-10 px-4">
      <p className="text-sm text-gray-500">Aperçu — application mobile technicien</p>

      <div className="relative w-[390px] max-w-full rounded-[2.5rem] border-8 border-gray-900 bg-gray-900 shadow-2xl">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-6 w-32 bg-gray-900 rounded-b-2xl z-10" />

        <div className="relative rounded-[2rem] overflow-hidden bg-white h-[760px] flex flex-col">
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-medium text-gray-900 shrink-0">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5" />
              <BatteryFull className="h-4 w-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">{children}</div>

          <div className="flex justify-center py-2 shrink-0">
            <div className="h-1 w-32 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
