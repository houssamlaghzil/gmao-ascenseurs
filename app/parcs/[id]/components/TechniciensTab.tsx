'use client';

/**
 * Onglet affichant la liste des techniciens du parc
 */

import { User, Wrench, CheckCircle, XCircle } from 'lucide-react';

interface TechniciensTabProps {
  techniciens: any[];
  parcId: string;
}

export default function TechniciensTab({ techniciens, parcId }: TechniciensTabProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Techniciens associés à ce parc
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {techniciens.length} technicien(s) disponible(s)
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {techniciens.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun technicien associé à ce parc</p>
          </div>
        ) : (
          techniciens.map((tech: any) => (
            <div key={tech.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {tech.nomComplet}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{tech.specialite}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        {tech.disponible ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              Disponible
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">
                              Occupé
                            </span>
                          </>
                        )}
                      </div>
                      {tech.nombreReparationsEnCours > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-gray-700">
                            {tech.nombreReparationsEnCours} réparation(s) en cours
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
