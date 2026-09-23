/**
 * Bandeau global rappelant qu'il s'agit d'une maquette (cahier des charges,
 * section 1) : aucune action de cet écran n'a d'effet réel sur un système
 * externe, même quand le libellé emploie un verbe métier ("valider",
 * "envoyer"...).
 */
export default function BandeauMaquette() {
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-800">
      <span>Maquette — données fictives et actions simulées</span>
    </div>
  );
}
