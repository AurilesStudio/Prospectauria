# 🥚 Palworld Tracker

Outil personnel de suivi de progression pour **Palworld**. Application web statique,
sans compte ni serveur : ta progression est sauvegardée **localement dans ton navigateur**
(localStorage), avec export/import possible.

## Fonctionnalités

- **📕 Paldex** — les 137 Pals (base 1.0). Marque ceux que tu as obtenus, mets des favoris,
  filtre par élément / aptitude de travail / obtenus / manquants, recherche, barre de progression.
- **🥚 Breeding** — deux modes :
  - `A + B = ?` : le résultat d'un croisement.
  - `Comment obtenir un Pal ?` : toutes les combinaisons de parents qui donnent un Pal cible.
  - Chaque fiche Pal liste aussi ses combinaisons de breeding.
- **✨ Passifs** — builds méta par rôle (Combat, Tank, Monture, Travail) + catalogue des passifs
  clés. Chaque fiche Pal propose un **build de passifs conseillé** selon son rôle déduit de ses stats.
- **🛡️ Joueur** — guide de progression par palier de niveau : quel équipement fabriquer selon la
  zone, ateliers/tech clés, Pals utiles, et boss de tour comme jalons (cochables).
- **🔧 Fabrications** — arbre technologique : ordre de déblocage conseillé des ateliers, cochable.

## Lancer

Aucune installation. Sert le dossier avec n'importe quel serveur statique :

```bash
cd palworld-tracker
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

> Un serveur est nécessaire (les modules ES et le `fetch` des données JSON ne
> fonctionnent pas en `file://`). Déployable tel quel sur GitHub Pages, Netlify, Vercel…

## Sauvegarde

- Tout est stocké dans `localStorage` (clé `palworld-tracker.v1`).
- Boutons **Export / Import** dans la barre du haut pour transférer ta progression
  entre navigateurs/appareils.

## Données & crédits

- Données Pals (stats, types, aptitudes, breeding) : [`mlg404/palworld-paldex-api`](https://github.com/mlg404/palworld-paldex-api).
- Images redimensionnées en vignettes locales.
- Les guides (passifs, équipement, tech tree) sont **indicatifs** et basés sur Palworld 1.0 —
  à ajuster selon les mises à jour du jeu. Facilement modifiables dans `js/content.js`.

## Structure

```
palworld-tracker/
├── index.html
├── styles.css
├── js/
│   ├── data.js       # chargement données + libellés FR + index breeding
│   ├── store.js      # persistance localStorage
│   ├── content.js    # passifs, builds, progression, tech tree (contenu curé, éditable)
│   └── app.js        # UI et interactions
├── data/
│   ├── pals.json     # 137 Pals (version allégée)
│   └── breeding.json # table de breeding complète
└── assets/           # vignettes Pals + icônes éléments/travaux
```
