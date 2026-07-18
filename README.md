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
- **📕 Paldex** — les 137 Pals (base 1.0). Marque ceux obtenus, favoris, filtres par
  élément / aptitude / obtenus-manquants, recherche, barre de progression.
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

- Données Pals (stats, types, aptitudes, breeding) : [`mlg404/palworld-paldex-api`](https://github.com/mlg404/palworld-paldex-api).
- Images redimensionnées en vignettes locales.
- Les guides (passifs, équipement, tech tree, boss) sont **indicatifs** et basés sur
  Palworld 1.0 — facilement modifiables dans `js/content.js`.

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
