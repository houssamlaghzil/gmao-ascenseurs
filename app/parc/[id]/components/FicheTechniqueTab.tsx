/**
 * Onglet Fiche technique de la fiche appareil (section 4.2).
 */

import { ReactNode } from 'react';
import { Ascenseur } from '@/domain/types';
import { formatDate } from '@/lib/utils';
import {
  LIBELLE_DETENTEUR_CLES,
  LIBELLE_TYPE_LIGNE_TELEALARME,
  LIBELLE_STATUT_TELEALARME,
} from '@/lib/derived/libelles-parc';

function Champ({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">{children}</dl>
    </div>
  );
}

export default function FicheTechniqueTab({ ascenseur }: { ascenseur: Ascenseur }) {
  const fiche = ascenseur.ficheTechnique;
  const { telealarme, gestionCles, accesLocalTechnique, localisationGPS } = fiche;

  return (
    <div className="space-y-6">
      <Section title="Appareil">
        <Champ label="Marque" value={fiche.marque} />
        <Champ label="Modèle" value={fiche.modele} />
        <Champ label="Date d'installation" value={formatDate(new Date(fiche.dateInstallation))} />
        <Champ label="Numéro de série" value={fiche.numeroSerie} />
        <Champ label="Référence constructeur" value={fiche.referenceConstructeur} />
        <Champ label="Charge utile" value={`${fiche.chargeUtileKg} kg`} />
        <Champ label="Vitesse" value={`${fiche.vitesseMs} m/s`} />
        <Champ label="Nombre de niveaux" value={fiche.nombreNiveaux} />
        <Champ
          label="Niveaux desservis"
          value={
            <div className="flex flex-wrap gap-1">
              {fiche.niveauxDesservis.map((niveau) => (
                <span key={niveau.code} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200">
                  {niveau.libelle}
                </span>
              ))}
            </div>
          }
        />
      </Section>

      <Section title="Téléalarme">
        <Champ label="Présente" value={telealarme.present ? 'Oui' : 'Non'} />
        <Champ label="Fournisseur" value={telealarme.fournisseur} />
        <Champ label="Numéro de carte / ligne" value={telealarme.numeroCarteLigne} />
        <Champ label="Type de ligne" value={telealarme.typeLigne ? LIBELLE_TYPE_LIGNE_TELEALARME[telealarme.typeLigne] : undefined} />
        <Champ label="Statut fonctionnel" value={LIBELLE_STATUT_TELEALARME[telealarme.statutFonctionnel]} />
        <Champ label="Dernier test" value={telealarme.dateDernierTest ? formatDate(new Date(telealarme.dateDernierTest)) : undefined} />
      </Section>

      <Section title="Accès">
        <Champ label="Digicode" value={fiche.digicode} />
        <Champ label="Gestion des clés" value={LIBELLE_DETENTEUR_CLES[gestionCles.detenteur]} />
        <Champ label="Localisation des clés" value={gestionCles.localisation} />
        <Champ label="Type de clé" value={gestionCles.typeCle} />
        <Champ label="Commentaire clés" value={gestionCles.commentaire} />
        <Champ label="Accès au local technique" value={accesLocalTechnique.localisation} />
        <Champ label="Digicode local technique" value={accesLocalTechnique.digicodeSpecifique} />
        <Champ label="Clé spécifique local technique" value={accesLocalTechnique.cleSpecifique} />
        <Champ label="Commentaire d'accès" value={accesLocalTechnique.commentaireAcces} />
      </Section>

      <Section title="Localisation">
        <Champ label="Latitude" value={localisationGPS ? localisationGPS.latitude : 'Non renseignée'} />
        <Champ label="Longitude" value={localisationGPS ? localisationGPS.longitude : 'Non renseignée'} />
      </Section>
    </div>
  );
}
