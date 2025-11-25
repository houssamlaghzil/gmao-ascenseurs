'use client';

/**
 * Liste des parcs avec leurs statistiques
 */

import Link from 'next/link';
import Card from '@/components/Card';
import { MapPin, ChevronRight, Building } from 'lucide-react';

interface ParcsListProps {
  parcs: any[];
}

export default function ParcsList({ parcs }: ParcsListProps) {
  return (
    <Card title="Vos Parcs d'Ascenseurs" subtitle={`${parcs.length} parc(s) actif(s)`}>
      <div className="space-y-4">
        {parcs.map((parc) => (
          <Link key={parc.id} href={`/parcs/${parc.id}`}>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {parc.nom}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{parc.description}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{parc.ville}</span>
                  </div>

                  {/* Statistiques du parc */}
                  {parc.stats && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-500">Total:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {parc.stats.totalAscenseurs}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-700">
                          {parc.stats.nombreFonctionnels}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-700">
                          {parc.stats.nombreEnPanne}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-sm text-gray-700">
                          {parc.stats.nombreEnReparation}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
