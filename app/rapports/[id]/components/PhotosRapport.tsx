/**
 * Photos jointes au rapport (section 29) — grille avec catégorie et légende.
 */

import { PhotoRapport } from '@/domain/types';
import { LIBELLE_CATEGORIE_PHOTO } from '@/lib/derived/libelles-rapports';

export default function PhotosRapport({ photos }: { photos: PhotoRapport[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Photos ({photos.length})</h2>
      {photos.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune photo jointe à ce rapport.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="space-y-1.5">
              <div className="aspect-[4/3] rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.legende ?? LIBELLE_CATEGORIE_PHOTO[photo.categorie]} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <figcaption>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                  {LIBELLE_CATEGORIE_PHOTO[photo.categorie]}
                </span>
                {photo.legende && <p className="text-xs text-gray-500 mt-1">{photo.legende}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
