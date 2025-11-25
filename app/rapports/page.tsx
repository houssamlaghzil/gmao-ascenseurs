'use client';

/**
 * Page de génération et affichage des rapports IA
 */

import { useState } from 'react';
import { FileText, Sparkles, Download, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RapportsPage() {
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const generateRapport = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rapports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setRapport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const downloadRapport = () => {
    if (!rapport) return;

    const blob = new Blob([rapport.rapport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${rapport.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary-600" />
          Rapports Journaliers IA
        </h1>
        <p className="mt-2 text-gray-600">
          Générez automatiquement des rapports détaillés grâce à l&apos;intelligence artificielle
        </p>
      </div>

      {/* Panneau de génération */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date du rapport
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            onClick={generateRapport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-md hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Sparkles className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Génération en cours...' : 'Générer le rapport'}</span>
          </button>

          {rapport && (
            <button
              onClick={downloadRapport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Télécharger</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Assurez-vous que la clé API OpenAI est configurée dans .env.local
            </p>
          </div>
        )}
      </div>

      {/* Affichage du rapport */}
      {rapport && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* En-tête du rapport */}
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Rapport du {new Date(rapport.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <div className="flex gap-6 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Événements: </span>
                    <span className="font-semibold text-gray-900">
                      {rapport.evenementsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total ascenseurs: </span>
                    <span className="font-semibold text-gray-900">
                      {rapport.statistiques.totalAscenseurs}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-semibold text-gray-900">
                      {rapport.statistiques.nombreFonctionnels}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="font-semibold text-gray-900">
                      {rapport.statistiques.nombreEnPanne}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      {rapport.statistiques.nombreEnReparation}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Généré par IA</span>
              </div>
            </div>
          </div>

          {/* Contenu du rapport */}
          <div className="p-8 prose prose-sm max-w-none">
            <ReactMarkdown>{rapport.rapport}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Message d'aide si pas de rapport */}
      {!rapport && !loading && (
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg border-2 border-dashed border-primary-200 p-12 text-center">
          <Sparkles className="h-16 w-16 text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Prêt à générer votre rapport
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Sélectionnez une date et cliquez sur &quot;Générer le rapport&quot; pour obtenir une
            analyse détaillée générée par l&apos;IA de vos opérations de maintenance.
          </p>
        </div>
      )}
    </div>
  );
}
