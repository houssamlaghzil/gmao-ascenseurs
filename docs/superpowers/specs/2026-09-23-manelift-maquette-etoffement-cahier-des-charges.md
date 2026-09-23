# Plan d'implantation de la maquette Manei-Lift — Web et Android

> Cahier des charges reçu tel quel de l'atelier de cadrage. Conservé ici comme référence stable pour les plans d'implémentation qui en découlent (voir `docs/superpowers/plans/2026-09-23-manelift-maquette-etoffement-roadmap.md`).

Destinataire : agent chargé de modifier la maquette.
État de référence : maquette publique https://manelift.ausmoz.ai/, parcourue le 23 septembre 2026.
Nature du travail : prototype interactif destiné aux ateliers et à la validation du cahier des charges. Ce document ne commande ni développement de production ni intégration effective à des API tierces.

## 1. Objectif et règles de travail

Transformer la maquette actuelle, déjà riche en tableaux et en fiches consultables, en une démonstration des actions quotidiennes des assistants d'exploitation, superviseurs et techniciens. Ajouter une maquette Android dédiée : elle doit être navigable comme une application de terrain, et non être une simple vue responsive du back-office.

Avant toute modification, inspecter le dépôt réellement fourni : framework, routeur, composants, styles, fixtures, scripts disponibles et conventions de nommage. Les chemins de routes proposés plus bas sont des cibles fonctionnelles ; les adapter aux conventions du projet. Ne pas inventer de fichiers ou d'imports en supposant une structure de dépôt. Conserver les liens profonds et les écrans existants.

### Niveaux de certitude à afficher dans l'interface

| Mention | Sens dans cette maquette |
| :--- | :--- |
| Démonstration | Interaction locale simulée avec données fictives cohérentes. Aucun traitement réel garanti. |
| À valider au cadrage | Règle métier, champ, droit ou périmètre encore attendu du cahier des charges et des ateliers utilisateurs. |
| API à vérifier | Données externes possibles en principe, mais documentation, accès et faisabilité non confirmés. |
| Hors première phase | Module visible pour expliquer la trajectoire, sans le présenter comme inclus dans la GMAO initiale. |

Ne jamais afficher « connecté », « temps réel », « prédictif », « envoyé au fournisseur » ou « synchronisé avec VINCI » comme une capacité livrée si la maquette ne fait que simuler l'état. Prévoir un discret bandeau global « Maquette — données fictives et actions simulées » et un statut local explicite sur chaque intégration. Les priorités ci-dessous sont des priorités de maquettage, pas une confirmation du contenu du futur devis.

## 2. Inventaire observé et principe de conservation

| Route ou zone existante | Déjà présent | À conserver / compléter |
| :--- | :--- | :--- |
| / | Tableau de bord, indicateurs, urgences, charge, activité, prédictif. | Conserver la vue ; ajouter les actions de dispatch et corriger les données de démonstration. |
| /explorer, /parc, /appareils/:id, /carte | Exploration par site, client, contrat, technicien, tournée, secteur et ville ; fiches appareil ; carte. | Conserver les filtres et liens ; relier la fiche aux actions métier. |
| /maintenances, /conformite | Vue prioritaire, calendrier et déficits contractuels. | Créer le détail ouvrable d'une maintenance et le parcours correctif du déficit. |
| /interventions, /interventions/:id | Liste, filtres, ticket, chronologie, rapports, formulaire de réattribution. | Conserver Réattribuer ; ajouter création, rapprochement, affectation initiale et traitement. |
| /rapports, /rapports/:id | Filtres, diagnostic, photos, signatures, états. | Ajouter validation, refus motivé, correction et transmission simulée. |
| /ctq, /ctq/reserves, /ctq/:id | Contrôles, réserves et suivi. | Conserver les réserves réglementaires de maintenance ; ne pas les confondre avec les réserves de chantier FunBIM. |
| /planning, /techniciens, /techniciens/:id | Agenda, absences, tâches, charge et synchronisation mobile. | Ajouter les actions de remplacement et la confirmation de réception mobile. |
| /contrats, /contrats/:id | Périmètre, cadence, SLA et responsables. | Utiliser ces règles dans les scénarios ; distinguer données déclarées et réelles. |
| /integrations, /administration, /taches | Six cartes d'intégration, rôles, référentiels, notifications, audit et tâches de fond. | Montrer la simulation, les erreurs traitables et la super-administration du hub. |

Observation vérifiée : cliquer la première ligne MNT-… de la vue prioritaire ne donne pas accès à une fiche de maintenance. Une absence affiche des tâches « à transférer » sans parcours de transfert visible. Le formulaire de réattribution d'une intervention existe déjà avec technicien, motif et commentaire : le réutiliser, sans créer un second parcours concurrent.

## 3. Navigation cible et structure des modules

Ne pas casser ni les URLs actuelles. Ajouter un sélecteur d'applications dans l'en-tête ou la barre latérale, et une page de lancement du hub si elle est utile au scénario. La GMAO Maintenance conserve son tableau de bord sur /.

| Module | Route suggérée | Contenu et traitement visuel |
| :--- | :--- | :--- |
| Hub | /hub | Tuiles « Maintenance » et « Cockpit Travaux » ; DATI et connecteurs en fonctions transverses. Badges « disponible dans la maquette », « à valider » ou « hors première phase ». |
| GMAO Maintenance | Routes Web existantes | Application prioritaire, navigation courante conservée. |
| Achats et pièces | /pieces ou /achats | Demandes issues des interventions, disponibilité simulée, validation, commande et réception. Le nom du module est à confirmer au cadrage. |
| Cockpit Travaux | /travaux | Synthèse de charge et avancement ; renvoi vers FunBIM pour le détail. Aucun clone de FunBIM. |
| Centre d'alertes DATI | /alertes-dati | Liste de remontées d'une solution autonome et acquittement simulé. Aucun moteur de détection DATI dans la GMAO. |
| Écarts de données | Sous-page d'/integrations | Comparaison Getraline/GMAO avec valeur brute, conversion et décision. |
| Page QR publique | Route de démonstration dédiée, sans identifiant interne prédictible | Information limitée destinée à un résident ; aucune donnée d'accès au bâtiment ou donnée personnelle. |
| Application Android simulée | /mobile-demo ou projet de prévisualisation séparé | Cadre de téléphone et écrans tactiles propres à l'application technicien ; navigation et états autonomes. |

La « super-administration » couvre l'accès aux applications du hub ; les rôles GMAO déjà visibles dans /administration couvrent les droits internes à la maintenance. Montrer les deux niveaux sans les fusionner.

## 4. Socle de données de démonstration

### 4.1. Source commune

Créer ou réutiliser une seule source de données fictives pour les scénarios Web et Android. Chaque appareil, intervention, maintenance, technicien, réserve, rapport et demande de pièce doit garder le même identifiant et le même état sur tous les écrans. Une action dans le mobile simulé doit modifier la vue Web correspondante durant la session de démonstration. Une action Web d'affectation doit apparaître dans la tournée mobile du technicien choisi.

L'agent peut employer le mécanisme de persistance déjà utilisé par le projet ; à défaut, conserver les changements dans la session et ajouter une action « Réinitialiser la démonstration » clairement séparée des commandes métier. Aucune API tierce ni base de production n'est nécessaire à cette maquette.

### 4.2. Objets et champs minimaux

| Objet | Champs requis pour la démonstration |
| :--- | :--- |
| Appareil | ID, site, client, contrat, adresse, secteur, technicien titulaire, tournée, état actuel, date/raison du dernier changement, dernier passage, prochaine visite planifiée, visites en retard. |
| Signalement | ID et source, appareil, date, déclarant fictif, motif, description, intervention rapprochée ou raison de créer une intervention distincte. |
| Intervention | ID, signalements associés, appareil, priorité, état du ticket, état physique de l'appareil, technicien, jalons horodatés, engagement applicable, diagnostic, pièce demandée, rapport et chronologie. |
| Maintenance | ID, appareil, opérations cumulables, date contractuelle fixe, date de réalisation, technicien, tournée, checklist, durée minimale, anomalies, rapport et état. |
| Absence | Technicien, période, remplaçant proposé, tâches affectées, tâches transférées, confirmation de réception. |
| Demande de pièce | ID, intervention et appareil, référence, quantité, disponibilité, décision, commande/réception, responsable et date prévue. |
| Rapport | ID, intervention ou maintenance, auteur, photos fictives, signature/absence motivée, état de validation, commentaire de correction et historique. |
| Événement externe | Source, ID externe, horodatage, contenu brut visible en vue technique, correspondance retenue, état du traitement, dernière erreur. |

Les chiffres agrégés doivent être calculés depuis les états de la démonstration ou explicitement marqués comme volumétrie illustrative du parc complet. Ne pas faire apparaître un échantillon de quelques centaines de rapports comme s'il représentait la totalité de l'historique. Utiliser une date de démonstration contrôlée, afin que les urgences, retards et validations restent cohérents lorsqu'on rejoue les scénarios.

### 4.3. Cohérence à corriger avant présentation

Sur A0001-01, la « prochaine maintenance » affichée au 21 février 2026 côtoie des visites réalisées plus tard en 2026. Présenter « visite en retard non réalisée » séparément de « prochaine visite planifiée » ; ne pas la rebaptiser prochaine visite.

Le tableau de bord présente des alertes « personne bloquée » anciennes de 12 à 19 jours. Pour la démonstration opérationnelle, utiliser des alertes récentes ou les placer dans une file d'anomalies historiques explicitement qualifiée.

Une réserve ne peut pas être montrée comme validée à une date future par rapport à la date de démonstration. Un journal d'état doit être ordonné et compatible avec l'état courant.

Les coordonnées, digicodes, clés et téléphones des fixtures doivent être fictifs ; la page QR publique n'y donne jamais accès.

## 5. Parcours Web à ajouter — priorité 1

**WEB-01 — File de dispatch sur le tableau de bord**

Ajouter au-dessus ou à proximité des urgences une file compacte « À traiter maintenant » avec onglets : personnes bloquées, non affectées, SLA proche, retards de maintenance et tâches à transférer. Chaque ligne contient appareil, adresse/secteur, source, âge du signalement, priorité, technicien ou « non affecté », prochaine action et lien vers la fiche. Le compteur est dérivé des lignes correspondantes. Une action de prise en charge retire ou déplace la ligne dans la bonne catégorie, sans effacer sa chronologie.

**WEB-02 — Création et rapprochement d'un signalement**

Depuis /interventions et la fiche appareil, ajouter « Nouveau signalement ». Champs : appareil recherché, source (appel client, Sérénité, Getraline, saisie interne, autre API), date/heure, motif, description, urgence et identité fictive du déclarant si autorisée. Après sélection de l'appareil, afficher les interventions encore ouvertes sur ce même appareil avec motif et heure : choix explicite « Ajouter ce signalement au ticket existant » ou « Créer une intervention distincte » avec motif. Ne jamais fusionner silencieusement deux urgences. L'ID source et l'ID local restent visibles sur la fiche.

À la validation simulée : créer l'événement dans la chronologie, mettre à jour les compteurs et ouvrir la fiche d'intervention. Prévoir états formulaire vide, appareil introuvable, doublon possible et confirmation. Aucune notification réelle ne part.

**WEB-03 — Affectation et suivi d'intervention**

Dans la fiche /interventions/:id, compléter le bouton Réattribuer existant par une affectation initiale lorsque le ticket est non affecté. Le choix du technicien montre secteur, disponibilité, nombre de tâches et absence éventuelle ; demander un motif si l'on force une affectation défavorable. La fiche montre une chronologie distincte : signalement reçu, ticket créé, affecté, reçu sur mobile, pris en charge, arrivée, travail, conclusion, validation. Montrer le temps contractuel applicable et l'étape qui manque lorsqu'un SLA est en danger.

États de démonstration : nouveau → à affecter → affecté → pris en charge → en route → sur site/en cours → terminé → à valider → clôturé. Branches : attente de pièce → à reprendre ; pas d'accès ; signalement rapproché ; annulation motivée. L'état du ticket et l'état physique de l'ascenseur sont deux champs différents : une intervention terminée peut laisser l'appareil à l'arrêt. Conserver l'historique de la réattribution et simuler l'accusé de réception sur le mobile.

**WEB-04 — Fiche maintenance et actions**

Rendre l'identifiant MNT-… de /maintenances ouvrable. La fiche affiche appareil, client/contrat, catégories réunies sur la même visite, date contractuelle, fenêtre de réalisation, durée minimale, responsable, état, checklist attendue, résultats des essais, anomalies, photos et rapport. Actions de maquette : affecter, déplacer avec justification et contrôle du quota annuel, regrouper des opérations compatibles, annuler avec motif, consulter le rapport et planifier un rattrapage.

Une visite faite en retard ne doit pas décaler automatiquement toutes les dates contractuelles futures. Dans /conformite, l'action « Voir les passages manquants » descend jusqu'aux appareils et aux opérations ; « Préparer un rattrapage » ouvre un aperçu des créneaux et de leur effet sur le déficit prévisible. L'utilisateur doit voir la différence entre un défaut de calendrier et une visite programmée mais non exécutée. La maquette peut simuler la confirmation sans modifier un vrai contrat.

**WEB-05 — Remplacement lors d'une absence**

Dans l'onglet Absences de /planning, ouvrir le détail des tâches « à transférer ». Ajouter sélection multiple, proposition de remplaçant, contrôle de secteur/charge, choix transférer les tâches sélectionnées ou toutes les tâches éligibles, récapitulatif avant confirmation et résultat par tâche. Une tâche déjà commencée, sans remplaçant compatible ou rejetée par le mobile reste dans une file d'exception visible. Après confirmation, le planning du remplaçant et sa tournée mobile se mettent à jour dans la session.

**WEB-06 — Pièces et achats liés à l'intervention**

Ajouter une entrée « Pièces / achats » et un bouton « Demander une pièce » dans l'intervention. Parcours : référence ou description → quantité → vérification de disponibilité simulée → demande → validation éventuelle → commande → réception → technicien informé → intervention « à reprendre ». Montrer qui attend l'action et depuis quand. Une demande non reçue ne doit pas faire passer l'appareil en service. Le connecteur SAP existant peut servir de source illustrative de catalogue, avec statut « API à vérifier » ; ne pas faire croire qu'une commande a été envoyée à SAP.

**WEB-07 — Validation de rapport**

Créer une file « Rapports à valider » depuis /rapports ou la file du tableau de bord. Sur la fiche, boutons de démonstration Valider, Demander une correction avec commentaire obligatoire, et Préparer la transmission après validation. États : brouillon local, soumis, à valider, à corriger, validé, transmis simulé. Montrer la version, les photos, les heures, l'état final de l'appareil, le signataire et le motif « client absent/indisponible » lorsqu'il n'a pas signé. Le technicien voit la correction dans sa maquette mobile.

## 6. Parcours Web à ajouter — priorité 2 et dépendances

**WEB-08 — Hub et super-administration**

Dans /hub, une tuile Maintenance ouvre la GMAO ; une tuile Travaux ouvre le cockpit limité. Dans /administration, ajouter un onglet « Applications et accès » : utilisateur, rôle dans le hub, applications accessibles, périmètre agence/secteur, rôle propre à chaque application. Pour la démonstration, fournir un sélecteur de rôle clairement indiqué comme simulation : super-administrateur, administrateur GMAO, assistant/dispatcheur, superviseur, technicien, lecteur client. Un rôle privé d'une action ne voit pas le bouton ou voit un refus explicite ; changer de rôle ne doit pas donner accès à de vraies données.

Les listes actuelles de permissions, référentiels et règles métier restent présentes. Ajouter au moins un exemple de modification simulée avec confirmation, journal d'audit et annulation/réinitialisation de la démonstration.

**WEB-09 — Cockpit Travaux / FunBIM**

Écran synthétique uniquement : projets, phase globale, responsable, charge, pourcentage d'avancement fourni ou simulé, jalon suivant, retard, dernière mise à jour et source. Clic sur un projet : synthèse et bouton « Ouvrir dans FunBIM » seulement si une URL de démonstration sûre existe ; sinon indiquer « lien à configurer ». État « données indisponibles » si API non confirmée. Ne pas développer dans la maquette interne les formulaires détaillés de réserves chantier, photos à adresser aux sous-traitants ou workflows complets de travaux : FunBIM est le choix d'Issam pour ce détail. Les réserves CTQ de maintenance restent dans la GMAO.

**WEB-10 — Sérénité et Getraline : détail des échanges**

Sur la fiche intervention, ajouter un panneau « Origine et suivi externe » : ID externe, source, heure de réception, appareil rapproché, événement d'origine, état local, dernière mise à jour, erreur éventuelle. Pour Sérénité, montrer la déclaration de panne et les étapes de suivi comme simulation ; sens exact des flux et champs à déterminer après lecture de l'API. Pour le « contrôle croisé Jetra Line » mentionné à l'oral, la maquette emploie actuellement le nom Getraline : vérifier avec Nicolas s'il s'agit du même service avant de créer un second connecteur.

Dans /integrations, ajouter une vue d'écarts Getraline/GMAO : ID externe, appareil rapproché, nomenclature source, nomenclature locale convertie, valeur source brute, valeur locale, type d'écart, date, action « confirmer / ignorer avec motif / demander examen ». Montrer les données brutes même en cas de conversion réussie. Ajouter les états « inconnu », « doublon », « appareil introuvable » et « erreur d'API ».

**WEB-11 — Alertes DATI externes**

Créer une console d'alertes issues d'un DATI autonome : technicien, type d'alerte reçu, heure, état, permanence responsable et historique d'acquittement. Une alerte simulée peut être acquittée dans la maquette, avec journal visible. La GMAO ne détecte pas elle-même chute, immobilité ou perte de verticalité ; éviter un bouton mobile « SOS GMAO » donnant une fausse impression de protection. Un lien vers l'application DATI peut être représenté sans simuler une couverture de sécurité effective.

**WEB-12 — QR code ascenseur**

Depuis la fiche appareil, offrir un aperçu public du résultat du QR code et un exemple de QR fictif. La page publique indique uniquement : identifiant public non sensible, bâtiment de manière publiable, état actuel, information de maintenance publiable, date estimée de remise en service si validée, date de dernière actualisation et lien de déclaration via Sérénité si le parcours est confirmé. États « date inconnue », « données momentanément indisponibles », « appareil en service » et « incident ouvert ». Ne jamais y montrer digicode, clés, numéro du technicien, contrat détaillé, rapport privé ou historique de sécurité.

**WEB-13 — Intégrations et tâches de fond**

Conserver les six cartes existantes et /taches, mais afficher pour chaque carte : statut de la démonstration, documentation reçue ou non, sens des flux, dernier événement fictif, erreurs à traiter et propriétaire du sujet. Les tâches échouées doivent offrir une vue de cause et de relance simulée, avec trace de la tentative. Ajouter FunBIM et DATI comme « API à vérifier », sans gonfler le compteur des « systèmes connectés ». La génération de synthèse IA et la maintenance prédictive restent des démonstrations optionnelles, sans perturber le parcours de maintenance prioritaire.

## 7. Maquette Android — spécification écran par écran

Créer des écrans avec dimensions et zones tactiles plausibles pour un téléphone Android de terrain. Barre de navigation simple, libellés métier, contraste lisible en extérieur, cibles tactiles généreuses. Le prototype doit être navigable au clavier et au toucher. L'en-tête permanent montre technicien, réseau, dernière synchronisation et nombre d'éléments en attente.

| ID | Écran | Contenu visible | Actions et transitions |
| :--- | :--- | :--- | :--- |
| M-01 | Accès et journée | Technicien de démonstration, journée/astreinte, dernier chargement local. | Démarrer la journée ; reprendre une session ; voir données disponibles hors connexion. Ne pas créer une fausse authentification de production. |
| M-02 | Accueil | Urgences reçues, tournée du jour, visites en retard, tâches à reprendre, rapports à corriger, état de synchronisation. | Ouvrir la mission prioritaire ou la tournée. Un changement Web apparaît ici. |
| M-03 | Tournée | Liste ordonnée des appareils avec urgence, horaire, adresse, types d'opération et statut. Filtres en retard / aujourd'hui / prochains jours. | Ouvrir mission, lancer GPS, signaler conflit de réaffectation. Afficher une absence ou un remplacement reçu. |
| M-04 | Recherche appareil | Recherche code/adresse/site, statut, fiche résumée. | Ouvrir fiche ; scanner un code dans la simulation si pertinent ; démarrer un rapport isolé selon droit. |
| M-05 | Fiche terrain appareil | Adresse, accès autorisé, consignes, technicien/tournée, état, derniers incidents, opérations dues. | Ouvrir navigation, appeler contact fictif, commencer mission, déclarer Pas d'accès directement. Les données d'accès ne figurent pas sur la page QR publique. |
| M-06 | Intervention entrante | Motif, source, urgence, délai, adresse, état appareil, éventuels signalements regroupés. | Accepter/prendre en charge, signaler indisponibilité, ouvrir GPS. Enregistrer les jalons dans la chronologie. |
| M-07 | Intervention sur site | Arrivée, état initial, diagnostic progressif : origine, zone/étage, équipement, état constaté, action. | Sauvegarde à chaque étape ; branche « pas d'accès » courte ; pièce nécessaire ; demande de renfort métier si retenue au cadrage. |
| M-08 | Visite de maintenance | Opérations cumulées, checklist par catégorie/contrat, test téléalarme, observations, durée minimale, anomalie. | Marquer conforme/non conforme/non applicable, photographier, créer anomalie, terminer. Si durée insuffisante, message clair et action de reprise ; ne pas permettre une clôture silencieuse. |
| M-09 | Pièce ou réserve | Pièce absente, quantité et référence ; réserve CTQ affectée avec échéance et preuve. | Créer demande de pièce, laisser l'intervention « en attente de pièce », traiter une réserve CTQ. Aucune réserve de chantier FunBIM ici. |
| M-10 | Rapport et clôture | Résumé, photos avant/après, heures, état final de l'appareil, signature technicien, client présent/signé/absent/indisponible. | Prévisualiser, corriger, soumettre. Si ascenseur reste à l'arrêt, le signaler distinctement de la fin du passage. |
| M-11 | Synchronisation | Brouillons enregistrés localement, envois en attente, pièces jointes restantes, erreurs et conflits. | Relancer, consulter le détail, résoudre une mission réattribuée. Ne jamais effacer une saisie locale à la suite d'un échec simulé. |
| M-12 | Historique et corrections | Missions terminées, rapports refusés avec commentaire, événements du jour. | Ouvrir et corriger un rapport, consulter la chronologie et confirmer une nouvelle affectation. |

### Règles transversales Android

Hors connexion : les écrans M-02 à M-10 restent utilisables sur les données déjà chargées. Montrer clairement ce qui est récent et ce qui peut être périmé. Les photos et signatures sont mises en attente avec le rapport.

Reconnexion : chaque opération est transmise au plus une fois dans la démonstration ; une relance ne crée pas un second rapport ou ticket. Afficher succès, échec et reprise par élément.

Conflit : si le Web réattribue une mission pendant qu'un technicien la modifie hors ligne, ne pas écraser l'une des versions silencieusement. Présenter un écran d'arbitrage ou une file de contrôle par l'exploitation.

Horaires : afficher heures locales et ordre chronologique correct lors d'un passage de minuit ; les durées restent positives. Les jalons et la source de chaque modification sont visibles sur la fiche Web.

## 8. Scénarios de démonstration à rendre rejouables

| Scénario | Départ | Séquence attendue | Preuve de réussite |
| :--- | :--- | :--- | :--- |
| S1 — Personne bloquée | Signalement entrant fictif sur un appareil donné, non affecté. | Web : rapprochement de doublon éventuel, qualification, affectation. Android : notification simulée, acceptation, arrivée, diagnostic, photos, état final, rapport. Web : validation. | Même ID, même technicien, même chronologie et même état appareil partout ; SLA et compteur mis à jour. |
| S2 — Visite préventive sans réseau | Maintenance en retard affectée dans une tournée. | Android : passage hors ligne, checklist, essai téléalarme, photo, signature ou absence motivée, soumission en attente ; reconnexion et reprise. Web : rapport à valider et déficit actualisé. | Aucune perte ni doublon ; la date contractuelle des visites futures ne se décale pas. |
| S3 — Pas d'accès | Mission sur site dont l'entrée est impossible. | Android : depuis fiche/mission, « Pas d'accès » → motif, photo facultative, tentative de contact, prochain traitement. Web : assistant voit l'exception et replanifie. | Le technicien ne traverse pas toutes les étapes du diagnostic ; l'appareil n'est pas faussement déclaré réparé. |
| S4 — Absence et remplacement | Technicien absent avec tâches « à transférer ». | Web : choisir remplaçant, transférer, voir exceptions. Android du remplaçant : nouvelle tournée et confirmation. | Compteurs transférées/restantes cohérents ; aucune tâche n'est perdue. |
| S5 — Attente de pièce | Diagnostic concluant à une pièce manquante. | Android : demande ; Web : traitement achat simulé ; réception ; nouvelle affectation ; reprise et clôture. | L'appareil reste à l'arrêt tant qu'aucune remise en service n'a été déclarée. |
| S6 — Écart externe | Getraline et GMAO divergent sur un appareil fictif. | Intégrations : données brutes, conversion, écart, décision et journal. | Aucune correction automatique opaque ; l'écart reste explicable. |

Ajouter un menu « Choisir un scénario » réservé à la maquette pour repartir de l'état initial. Les scénarios ne doivent pas dépendre d'une intervention sur un service réel.

## 9. Droits à illustrer

| Profil de maquette | Actions visibles |
| :--- | :--- |
| Super-administrateur hub | Accès aux applications et gestion des habilitations transverses. |
| Administrateur GMAO | Paramétrage GMAO, utilisateurs, référentiels, intégrations, journaux. |
| Assistant / dispatcheur | Créer et rapprocher un signalement, affecter/réattribuer, gérer exceptions et planning selon habilitation. |
| Superviseur / responsable de parc | Suivre SLA et conformité, valider des rapports, approuver les décisions selon règle à confirmer. |
| Technicien | Ses missions Android, appareil autorisé, constat, rapport, photos, réserve CTQ, synchronisation. |
| Lecteur client | Lecture restreinte aux données publiables de son périmètre, si cet accès est retenu plus tard. |
| Public QR | Seule la page publique limitée de l'appareil. |

Ne pas déduire automatiquement un droit d'achat, d'accès aux digicodes ou d'acquittement DATI du seul rôle « technicien ». Marquer ces règles à valider au cadrage.

## 10. Ordre de réalisation demandé à l'agent

1. Inventorier et sécuriser l'existant. Identifier routes/composants/fixtures ; relever les interactions déjà opérationnelles ; poser un point de restauration. Préserver les vues et liens actuels.
2. Unifier les scénarios et corriger les données. Même état Web/Android, horloge de démonstration stable, compteurs cohérents, action de réinitialisation.
3. Terminer la GMAO Web prioritaire. WEB-01 à WEB-07 dans cet ordre logique : dispatch, signalement, affectation, fiche maintenance, absences, pièces, rapports.
4. Créer la maquette Android complète. M-01 à M-12 et scénarios S1 à S5, avec états hors ligne et synchronisation.
5. Ajouter hub et études externes. WEB-08 à WEB-13, S6 et QR public, avec statut de faisabilité affiché. Ne pas bloquer les scénarios maintenance sur une API inconnue.
6. Faire une revue métier. Rejouer les scénarios avec technicien et assistant d'exploitation ; noter chaque libellé, étape et droit contesté pour le cahier des charges. Ne pas transformer une hypothèse en règle ferme sans validation.

## 11. Critères de recette de la maquette

- Chaque ligne prioritaire mène à une fiche ou à une action utile : plus de maintenance MNT-… non ouvrable ni de tâches d'absence affichées « à transférer » sans parcours correspondant.
- Les six scénarios sont accessibles, peuvent être parcourus jusqu'à leur état final et réinitialisés. Les états et compteurs restent cohérents entre tableau de bord, fiche appareil, planning, Web et Android.
- Le parcours « Pas d'accès » s'atteint directement depuis la mission ; la clôture avec appareil encore à l'arrêt est représentée correctement.
- L'Android simulé montre réellement la sauvegarde locale, la file en attente, une erreur, la reprise et un conflit de réattribution. Une relance n'ajoute aucun doublon.
- Une absence transfère les tâches sélectionnées et laisse les exceptions visibles. Une visite manquante peut être examinée depuis la conformité jusqu'à l'appareil et au calendrier.
- Sérénité, Getraline, FunBIM, DATI et SAP sont distingués par source, sens des flux et statut de faisabilité. Aucun effet externe fictif n'est présenté comme une intégration effective.
- Le cockpit Travaux n'empiète pas sur le détail FunBIM ; la page QR ne divulgue aucune donnée de terrain privée ; les rôles limitent les actions de la démonstration.
- Les écrans restent lisibles à résolution bureau et dans le cadre Android, les formulaires ont des états vide/erreur/succès, et les liens ou boutons de démonstration ne mènent pas à une page blanche.
- Exécuter les scripts de vérification réellement présents dans le dépôt (typecheck, lint, build ou tests ciblés selon disponibilité), puis parcourir manuellement S1, S2 et S3. Corriger les régressions observées avant livraison.

## 12. Hors périmètre de cette implantation de maquette

La mise en place réelle de l'API FunBIM, Sérénité, Getraline, SAP ou DATI ; le dimensionnement serveur VINCI ; la migration de la base Biinsa ; les protocoles de sécurité de production ; la signature à valeur probatoire renforcée ; la détection DATI ; l'envoi de SMS ou de commandes ; la mise en production Android. Ces travaux seront étudiés et chiffrés après documentation, accès de test, ateliers utilisateurs et cahier des charges. La maquette doit expliquer leur place et leurs dépendances, sans les simuler comme des services déjà opérationnels.

## Addenda — écart constaté avec l'état réel du dépôt (2026-09-23)

Ce cahier des charges a été rédigé après consultation de la seule maquette **publique** (`manelift.ausmoz.ai`), sans accès au dépôt. Une fois le dépôt `gmao-ascenseurs` inspecté (voir le plan d'implémentation qui suit), un écart important est apparu par rapport à la section 7 : **une maquette Android fonctionnelle existe déjà** sous `app/mobile/**` (connexion, accueil, tournée, fiche appareil, recherche, démarrage/diagnostic/clôture d'intervention, maintenance avec checklist et test téléalarme, CTQ, rapport isolé, synchronisation, indicateur PTI/DATI), rendue dans un cadre téléphone (`app/mobile/components/PhoneFrame.tsx`). Elle n'est simplement pas **découvrable** : aucun lien n'y mène depuis la navigation Web (`app/components/Navigation.tsx`), d'où sa probable absence de la revue ayant produit ce document.

En conséquence, la section 7 (et l'ordre de réalisation, section 10, étape 4) doivent être lus comme « auditer et compléter l'existant », pas « créer ». Voir le plan de fondations pour le détail de cet écart et son traitement.
