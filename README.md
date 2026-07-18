# 🥚 Palworld Tracker

Outil personnel de suivi de progression pour **Palworld**. Application web statique,
sans compte ni serveur : ta progression est sauvegardée **localement dans ton navigateur**
(localStorage), avec export/import possible.

> 💡 Le dépôt peut être renommé « Palworld » dans **Settings → General → Rename** sur GitHub
> (action réservée au propriétaire). Le contenu est déjà 100 % dédié à Palworld.

## Fonctionnalités

- **🏠 Accueil** — tableau de bord : anneaux de progression (Pals, boss, technologies,
  objectifs), compteurs de collectibles (effigies de Lifmunk, points de voyage rapide,
  donjons) et prochains objectifs.
- **📕 Paldex** — les **299 Pals du Paldeck 1.0** (numérotation du jeu, noms FR). Marque
  ceux obtenus, favoris, filtres par élément / aptitude / obtenus-manquants, recherche.
- **🥚 Breeding** — `A + B = ?` et *« Comment obtenir ce Pal ? »* (toutes les combinaisons
  de parents). Chaque fiche Pal liste aussi son breeding.
- **✨ Passifs** — builds méta par rôle (Combat, Tank, Monture, Travail) + catalogue des
  passifs clés. Chaque fiche Pal propose un build conseillé selon son rôle déduit des stats.
- **⚒️ Base** — meilleurs Pals par tâche de travail (12 postes), triés par niveau d’aptitude,
  filtrables sur tes Pals obtenus. Pour optimiser l’affectation à la base.
- **👑 Boss** — tours (jalons) + boss de terrain / légendaires, avec niveau et région
  indicatifs, cochables.
- **🛡️ Joueur** — guide de progression par palier de niveau : équipement selon la zone,
  ateliers/tech clés, Pals utiles, boss de tour.
- **🔧 Fabrications** — arbre technologique : ordre de déblocage conseillé, cochable.
- **🎯 Objectifs** — ta to-do Palworld personnelle (ajout / catégories / suggestions).
- **🗃️ Données & mises à jour** — au lancement, l'outil **vérifie automatiquement** s'il
  existe une nouvelle version des données de jeu (via PalCalc) et affiche l'état
  (à jour / mise à jour dispo / hors ligne). Bouton de vérification manuelle sur le tableau de bord.

## Lancer

Aucune installation. Sert le dossier avec n'importe quel serveur statique :

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

> Un serveur est nécessaire (les modules ES et le `fetch` des données JSON ne
> fonctionnent pas en `file://`). Déployable tel quel sur GitHub Pages, Netlify, Vercel…

## Sauvegarde

- Tout est stocké dans `localStorage` (clé `palworld-tracker.v1`).
- Boutons **Export / Import** dans la barre du haut pour transférer ta progression
  entre navigateurs / appareils.

## Données & crédits

- **Roster / breeding / stats / noms FR** : [`tylercamp/PalCalc`](https://github.com/tylercamp/palcalc)
  (extrait des fichiers du jeu, Palworld 1.0 — 299 Pals).
- **Éléments / drops / compétences de partenaire** : [`blaynem/paldex`](https://github.com/blaynem/paldex).
- **Images** : vignettes locales pour les 137 Pals disponibles ; les nouveaux Pals 1.0
  affichent une vignette générique (élément) en attendant.
- Les guides (passifs, équipement, tech tree, boss) sont **indicatifs** et modifiables
  dans `js/content.js`.

### Couverture des données 1.0

| Élément | Couverture |
|---|---|
| Pals (roster, stats, aptitudes, noms FR) | **299 / 299** ✅ |
| Éléments (types) | 205 / 299 (variantes déduites ; ~93 nouvelles espèces en attente) |
| Images officielles | 137 / 299 (le reste : vignette générique) |
| Breeding (recettes) | 137 / 299 (Pals d'origine ; nouveaux Pals à venir) |

> Le wiki et les CDN d'images de Palworld ne sont pas accessibles depuis l'environnement de
> build. Les éléments/images/recettes manquants se compléteront quand la source de données
> `blaynem/paldex` passera en 1.0 — la **vérification de mise à jour au lancement** sert à
> détecter ces nouvelles versions. Le dataset se régénère via le script `scripts/build.py`.

### Régénérer / mettre à jour le dataset

```bash
python3 scripts/build.py   # re-télécharge les sources et reconstruit data/*.json + images
```

## Structure

```
.
├── index.html
├── styles.css
├── js/
│   ├── data.js       # chargement données + libellés FR + index breeding
│   ├── store.js      # persistance localStorage (Pals, objectifs, compteurs…)
│   ├── content.js    # passifs, builds, progression, tech tree, boss (contenu curé)
│   └── app.js        # UI et interactions
├── data/
│   ├── pals.json     # 137 Pals (version allégée)
│   └── breeding.json # table de breeding complète
└── assets/           # vignettes Pals + icônes éléments/travaux
```
