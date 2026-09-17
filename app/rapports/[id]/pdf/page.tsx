/**
 * Aperçu PDF client (section 9.3) — rendu HTML/CSS à l'apparence d'un PDF
 * imprimé : fond blanc, marges généreuses, contraste élevé, grandes photos
 * (une par section, section 9.3), chronologie claire, signatures visibles.
 * Pas d'export fichier réel : window.print() (bouton "Imprimer") suffit
 * pour la démo. S'appuie sur lib/derived/rapport-pdf.ts, qui remplit le
 * type RapportPdfApercu déjà défini par le domaine.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { RattachementRapport, StatutSignatureClient } from '@/domain/types';
import { getAscenseurById, getRapportById } from '@/data/store';
import { construireApercuPdfRapport } from '@/lib/derived/rapport-pdf';
import { LIBELLE_TYPE_RAPPORT } from '@/lib/derived/libelles-parc';
import { LIBELLE_CATEGORIE_PHOTO, LIBELLE_STATUT_SIGNATURE_CLIENT } from '@/lib/derived/libelles-rapports';
import { formatDate } from '@/lib/utils';
import BoutonImprimer from './components/BoutonImprimer';

interface RapportPdfPageProps {
  params: { id: string };
}

export default function RapportPdfPage({ params }: RapportPdfPageProps) {
  const rapport = getRapportById(params.id);
  if (!rapport) notFound();

  const ascenseur = getAscenseurById(rapport.ascenseurId);
  const apercu = construireApercuPdfRapport(rapport);

  return (
    <div className="space-y-6">
      {/* Barre d'actions — masquée à l'impression */}
      <div className="print:hidden flex items-center justify-between">
        <Link href={`/rapports/${rapport.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Retour au rapport
        </Link>
        <BoutonImprimer />
      </div>

      {/* Masque la coquille de l'application (barre latérale) à l'impression */}
      <style>{`
        @media print {
          nav { display: none !important; }
          main { padding-left: 0 !important; }
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* Document */}
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm print:border-none print:shadow-none rounded-lg print:rounded-none p-8 sm:p-12 text-black">
        <header className="flex items-start justify-between border-b-2 border-black pb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Manei-Lift</p>
            <h1 className="text-2xl font-bold mt-1">Rapport {LIBELLE_TYPE_RAPPORT[rapport.typeRapport].toLowerCase()}</h1>
            <p className="text-sm text-gray-600 mt-1">{rapport.numero}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{apercu.clientNom}</p>
            <p className="text-gray-600">{apercu.appareilCode}</p>
            <p className="text-gray-600">{rapport.adresseAppareil}</p>
            {ascenseur?.ville && <p className="text-gray-600">{ascenseur.ville}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-300 text-sm">
          <ChampPdf label="Technicien" valeur={rapport.technicienNom} />
          <ChampPdf label="Date" valeur={formatDate(new Date(rapport.dateHeureDebut))} />
          <ChampPdf label="Durée" valeur={rapport.dureeMinutes != null ? `${rapport.dureeMinutes} min` : '—'} />
          <ChampPdf
            label="Passage"
            valeur={
              rapport.rattachement === RattachementRapport.INTERVENTION && rapport.numeroPassageIntervention
                ? `n°${rapport.numeroPassageIntervention}`
                : '—'
            }
          />
        </section>

        {/* Chronologie */}
        <section className="py-6 border-b border-gray-300">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Chronologie de l&apos;intervention</h2>
          <ol className="space-y-3">
            {apercu.chronologie.map((etape, idx) => (
              <li key={`${etape.libelle}-${idx}`} className="flex items-baseline gap-3">
                <span className="h-2 w-2 rounded-full bg-black shrink-0" />
                <span className="font-medium">{etape.libelle}</span>
                <span className="text-gray-500 text-sm">— {formatDate(new Date(etape.dateHeure))}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Diagnostic / constat */}
        {rapport.accesObtenu ? (
          rapport.diagnostic && (
            <section className="py-6 border-b border-gray-300">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Constat et action réalisée</h2>
              <p className="text-sm leading-relaxed">
                {rapport.diagnostic.equipementLibelle && <>Équipement concerné : <strong>{rapport.diagnostic.equipementLibelle}</strong>. </>}
                {rapport.diagnostic.etatConstateLibelle && <>État constaté : <strong>{rapport.diagnostic.etatConstateLibelle}</strong>. </>}
                {rapport.diagnostic.actionLibelle && <>Action réalisée : <strong>{rapport.diagnostic.actionLibelle}</strong>.</>}
              </p>
              {rapport.diagnostic.commentaireDiagnostic && (
                <p className="text-sm text-gray-700 mt-2">{rapport.diagnostic.commentaireDiagnostic}</p>
              )}
            </section>
          )
        ) : (
          <section className="py-6 border-b border-gray-300">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Constat</h2>
            <p className="text-sm">Accès à l&apos;appareil non obtenu lors du passage.</p>
            {rapport.refusAcces?.commentaire && <p className="text-sm text-gray-700 mt-1">{rapport.refusAcces.commentaire}</p>}
          </section>
        )}

        {rapport.commentaire && (
          <section className="py-6 border-b border-gray-300">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Compte-rendu</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">{rapport.commentaire}</p>
          </section>
        )}

        {/* Photos mises en avant : une photo importante par section */}
        {apercu.photosMisesEnAvant.length > 0 && (
          <section className="py-6 border-b border-gray-300">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Photos</h2>
            <div className="space-y-6">
              {apercu.photosMisesEnAvant.map((photo) => (
                <figure key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.legende ?? LIBELLE_CATEGORIE_PHOTO[photo.categorie]}
                    className="w-full max-h-[420px] object-cover rounded border border-gray-300"
                  />
                  <figcaption className="text-xs text-gray-600 mt-2 font-medium uppercase tracking-wide">
                    {LIBELLE_CATEGORIE_PHOTO[photo.categorie]}
                    {photo.legende && <span className="font-normal normal-case"> — {photo.legende}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Signatures */}
        <section className="py-6">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Signatures</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 rounded p-4 min-h-[110px]">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Technicien</p>
              <p className="text-sm font-semibold mt-1">{rapport.technicienNom}</p>
              {rapport.signatureTechnicien && (
                <p className="text-xs text-gray-500 mt-8">Signé le {formatDate(new Date(rapport.signatureTechnicien.dateHeure))}</p>
              )}
            </div>
            <div className="border border-gray-300 rounded p-4 min-h-[110px]">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
              {rapport.signatureClient ? (
                <>
                  <p className="text-sm font-semibold mt-1">
                    {rapport.signatureClient.statut === StatutSignatureClient.SIGNE
                      ? rapport.signatureClient.nomSignataire
                      : LIBELLE_STATUT_SIGNATURE_CLIENT[rapport.signatureClient.statut]}
                  </p>
                  {rapport.signatureClient.motifAbsenceOuIndisponibilite && (
                    <p className="text-xs text-gray-500 mt-1">{rapport.signatureClient.motifAbsenceOuIndisponibilite}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-6">{formatDate(new Date(rapport.signatureClient.dateHeure))}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Aucune signature enregistrée</p>
              )}
            </div>
          </div>
        </section>

        <footer className="pt-6 border-t border-gray-300 text-center text-xs text-gray-400">
          Document généré depuis Manei-Lift GMAO — {formatDate(new Date())}
        </footer>
      </div>
    </div>
  );
}

function ChampPdf({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="font-medium mt-0.5">{valeur}</p>
    </div>
  );
}
