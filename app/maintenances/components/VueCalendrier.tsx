'use client';

/**
 * Vue calendrier de l'écran Maintenances (section 6.1) : bascule entre vue
 * annuelle / mensuelle / hebdomadaire, état local ('use client').
 *
 * Avec ~31 600 occurrences pour l'année en cours, cette vue n'affiche
 * JAMAIS les objets Maintenance individuels : seulement des compteurs par
 * jour/mois et par catégorie (voir lib/derived/maintenances-calendrier.ts),
 * déjà calculés côté serveur pour l'année entière (vue annuelle), la grille
 * du mois affiché (vue mensuelle) et la semaine affichée (vue
 * hebdomadaire). Basculer entre les 3 granularités est donc purement local
 * : aucune de ces données n'a besoin d'être rechargée. Changer de mois ou
 * de semaine affichée, en revanche, redemande au serveur les compteurs de
 * la nouvelle période (liens `<Link>`) — le détail individuel d'un passage
 * reste la responsabilité de la vue prioritaire (section 6.2).
 */

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarCheck2 } from 'lucide-react';
import { CategorieMaintenance } from '@/domain/types';
import { CategorieMaintenanceBadge } from '@/components/StatusBadges';
import { LIBELLE_CATEGORIE_MAINTENANCE } from '@/lib/derived/libelles-parc';
import type { CompteurJour, CompteurMois } from '@/lib/derived/maintenances-calendrier';

type Granularite = 'annee' | 'mois' | 'semaine';

/** Couleurs des points de densité (mois/année) — cohérentes avec la palette de CategorieMaintenanceBadge, sans en dépendre (un badge plein est trop large pour une cellule de jour). */
const COULEUR_DOT: Record<CategorieMaintenance, string> = {
  [CategorieMaintenance.PERIODIQUE]: 'bg-sky-500',
  [CategorieMaintenance.CABLE]: 'bg-indigo-500',
  [CategorieMaintenance.PARACHUTE]: 'bg-purple-500',
  [CategorieMaintenance.NETTOYAGE]: 'bg-teal-500',
  [CategorieMaintenance.AUTRE]: 'bg-gray-400',
};

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function libelleMoisAnnee(moisKey: string): string {
  const [annee, mois] = moisKey.split('-').map(Number);
  return majuscule(new Date(Date.UTC(annee, mois - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
}

function libelleMoisSeul(moisKey: string): string {
  const [annee, mois] = moisKey.split('-').map(Number);
  return majuscule(new Date(Date.UTC(annee, mois - 1, 1)).toLocaleDateString('fr-FR', { month: 'long' }));
}

function libelleJour(dateKey: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('fr-FR', options);
}

interface VueCalendrierProps {
  granulariteInitiale: Granularite;
  compteursAnnee: CompteurMois[];
  moisAffiche: string; // YYYY-MM
  compteursMois: CompteurJour[]; // grille complète (35 ou 42 jours), semaines de 7
  semaineAffichee: string; // YYYY-MM-DD (lundi)
  compteursSemaine: CompteurJour[]; // 7 jours
  moisPrecedentHref: string;
  moisSuivantHref: string;
  semainePrecedenteHref: string;
  semaineSuivanteHref: string;
  aujourdHuiHref: string;
}

export default function VueCalendrier({
  granulariteInitiale,
  compteursAnnee,
  moisAffiche,
  compteursMois,
  semaineAffichee,
  compteursSemaine,
  moisPrecedentHref,
  moisSuivantHref,
  semainePrecedenteHref,
  semaineSuivanteHref,
  aujourdHuiHref,
}: VueCalendrierProps) {
  const [granularite, setGranularite] = useState<Granularite>(granulariteInitiale);
  const aujourdHuiKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            <BoutonGranularite label="Année" actif={granularite === 'annee'} onClick={() => setGranularite('annee')} />
            <BoutonGranularite label="Mois" actif={granularite === 'mois'} onClick={() => setGranularite('mois')} />
            <BoutonGranularite label="Semaine" actif={granularite === 'semaine'} onClick={() => setGranularite('semaine')} />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {Object.values(CategorieMaintenance).map((categorie) => (
              <CategorieMaintenanceBadge key={categorie} categorie={categorie} />
            ))}
          </div>
        </div>

        {granularite === 'annee' && <VueAnnee compteursAnnee={compteursAnnee} />}

        {granularite === 'mois' && (
          <VueMois
            moisAffiche={moisAffiche}
            compteursMois={compteursMois}
            aujourdHuiKey={aujourdHuiKey}
            hrefPrecedent={moisPrecedentHref}
            hrefSuivant={moisSuivantHref}
            hrefAujourdHui={aujourdHuiHref}
          />
        )}

        {granularite === 'semaine' && (
          <VueSemaine
            semaineAffichee={semaineAffichee}
            compteursSemaine={compteursSemaine}
            aujourdHuiKey={aujourdHuiKey}
            hrefPrecedent={semainePrecedenteHref}
            hrefSuivant={semaineSuivanteHref}
            hrefAujourdHui={aujourdHuiHref}
          />
        )}
      </div>
    </div>
  );
}

function BoutonGranularite({ label, actif, onClick }: { label: string; actif: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        actif ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

function EnTeteNavigation({ titre, hrefPrecedent, hrefSuivant, hrefAujourdHui }: { titre: string; hrefPrecedent: string; hrefSuivant: string; hrefAujourdHui: string }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={hrefPrecedent} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
      <div className="flex items-center gap-1">
        <Link href={hrefAujourdHui} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Revenir à aujourd'hui">
          <CalendarCheck2 className="h-4 w-4" />
        </Link>
        <Link href={hrefSuivant} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Liste compacte "point coloré + nombre" pour les catégories présentes (mois/année). */
function PointsDensite({ parCategorie }: { parCategorie: Record<CategorieMaintenance, number> }) {
  const categoriesPresentes = Object.values(CategorieMaintenance).filter((c) => parCategorie[c] > 0);
  if (categoriesPresentes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-1">
      {categoriesPresentes.map((categorie) => (
        <span key={categorie} className="inline-flex items-center gap-0.5 text-[11px] text-gray-600" title={LIBELLE_CATEGORIE_MAINTENANCE[categorie]}>
          <span className={`h-1.5 w-1.5 rounded-full ${COULEUR_DOT[categorie]}`} />
          {parCategorie[categorie]}
        </span>
      ))}
    </div>
  );
}

function VueAnnee({ compteursAnnee }: { compteursAnnee: CompteurMois[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Vue annuelle — {compteursAnnee[0]?.moisKey.slice(0, 4)}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {compteursAnnee.map((mois) => (
          <div key={mois.moisKey} className="border border-gray-200 rounded-md p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-900">{libelleMoisSeul(mois.moisKey)}</span>
              <span className="text-xs text-gray-500">{mois.total.toLocaleString('fr-FR')}</span>
            </div>
            <PointsDensite parCategorie={mois.parCategorie} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VueMois({
  moisAffiche,
  compteursMois,
  aujourdHuiKey,
  hrefPrecedent,
  hrefSuivant,
  hrefAujourdHui,
}: {
  moisAffiche: string;
  compteursMois: CompteurJour[];
  aujourdHuiKey: string;
  hrefPrecedent: string;
  hrefSuivant: string;
  hrefAujourdHui: string;
}) {
  return (
    <div>
      <EnTeteNavigation titre={libelleMoisAnnee(moisAffiche)} hrefPrecedent={hrefPrecedent} hrefSuivant={hrefSuivant} hrefAujourdHui={hrefAujourdHui} />

      <div className="grid grid-cols-7 gap-px mt-3 text-xs font-medium text-gray-500 uppercase">
        {JOURS_SEMAINE.map((jour) => (
          <div key={jour} className="text-center py-1">
            {jour}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {compteursMois.map((jour) => {
          const horsDuMois = jour.dateKey.slice(0, 7) !== moisAffiche;
          const estAujourdHui = jour.dateKey === aujourdHuiKey;
          return (
            <div
              key={jour.dateKey}
              className={`min-h-[64px] rounded-md border p-1.5 ${
                estAujourdHui ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-100'
              } ${horsDuMois ? 'bg-gray-50 opacity-50' : 'bg-white'}`}
            >
              <span className={`text-xs ${estAujourdHui ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{Number(jour.dateKey.slice(8, 10))}</span>
              <PointsDensite parCategorie={jour.parCategorie} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VueSemaine({
  semaineAffichee,
  compteursSemaine,
  aujourdHuiKey,
  hrefPrecedent,
  hrefSuivant,
  hrefAujourdHui,
}: {
  semaineAffichee: string;
  compteursSemaine: CompteurJour[];
  aujourdHuiKey: string;
  hrefPrecedent: string;
  hrefSuivant: string;
  hrefAujourdHui: string;
}) {
  const premier = compteursSemaine[0];
  const dernier = compteursSemaine[compteursSemaine.length - 1];
  const titre =
    premier && dernier
      ? `Semaine du ${libelleJour(premier.dateKey, { day: 'numeric', month: 'long' })} au ${libelleJour(dernier.dateKey, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      : `Semaine du ${semaineAffichee}`;

  return (
    <div>
      <EnTeteNavigation titre={titre} hrefPrecedent={hrefPrecedent} hrefSuivant={hrefSuivant} hrefAujourdHui={hrefAujourdHui} />

      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 mt-3">
        {compteursSemaine.map((jour) => {
          const estAujourdHui = jour.dateKey === aujourdHuiKey;
          const categoriesPresentes = Object.values(CategorieMaintenance).filter((c) => jour.parCategorie[c] > 0);
          return (
            <div
              key={jour.dateKey}
              className={`rounded-md border p-2 ${estAujourdHui ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}
            >
              <div className="flex items-baseline justify-between">
                <span className={`text-xs font-medium ${estAujourdHui ? 'text-blue-700' : 'text-gray-700'}`}>
                  {majuscule(libelleJour(jour.dateKey, { weekday: 'short' }))} {Number(jour.dateKey.slice(8, 10))}
                </span>
                <span className="text-xs text-gray-500">{jour.total.toLocaleString('fr-FR')}</span>
              </div>
              <div className="mt-1.5 space-y-1">
                {categoriesPresentes.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune</p>
                ) : (
                  categoriesPresentes.map((categorie) => (
                    <div key={categorie} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${COULEUR_DOT[categorie]}`} />
                        {LIBELLE_CATEGORIE_MAINTENANCE[categorie]}
                      </span>
                      <span className="font-medium text-gray-900">{jour.parCategorie[categorie]}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
