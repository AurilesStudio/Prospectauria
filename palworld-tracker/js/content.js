// content.js — connaissances curées : passifs, recommandations, progression joueur, tech tree
// Note : basé sur Palworld 1.0. Valeurs indicatives, à ajuster selon tes patchs.

// ---------- Catalogue de passifs ----------
export const PASSIVES = {
  legend:      { name: 'Légende (Legend)',       tier: 'S', effect: 'Attaque +20 %, Défense +20 %, Vitesse +15 %', note: 'Uniquement sur les légendaires (Jetragon, Frostallion, Necromus, Paladius…).' },
  musclehead:  { name: 'Costaud (Musclehead)',   tier: 'S', effect: 'Attaque +30 %, Vitesse de travail −50 %', note: 'Le meilleur gain d’attaque. À éviter sur les Pals de travail.' },
  ferocious:   { name: 'Féroce (Ferocious)',     tier: 'A', effect: 'Attaque +20 %' },
  sadist:      { name: 'Sadique (Sadist)',       tier: 'B', effect: 'Attaque +15 %, Défense −15 %' },
  burly:       { name: 'Corps massif (Burly Body)', tier: 'A', effect: 'Défense +20 %' },
  hardskin:    { name: 'Peau dure (Hard Skin)',  tier: 'B', effect: 'Défense +10 %' },
  masochist:   { name: 'Masochiste (Masochist)', tier: 'B', effect: 'Défense +15 %, Attaque −15 %' },
  swift:       { name: 'Rapide (Swift)',         tier: 'A', effect: 'Vitesse de déplacement +30 %' },
  runner:      { name: 'Coureur (Runner)',       tier: 'B', effect: 'Vitesse de déplacement +20 %' },
  nimble:      { name: 'Agile (Nimble)',         tier: 'C', effect: 'Vitesse de déplacement +10 %' },
  artisan:     { name: 'Artisan (Artisan)',      tier: 'S', effect: 'Vitesse de travail +50 %', note: 'Indispensable sur les Pals de base.' },
  lucky:       { name: 'Chanceux (Lucky)',       tier: 'A', effect: 'Attaque +15 %, Vitesse de travail +15 %', note: 'Polyvalent : combat léger + travail.' },
  serene:      { name: 'Serein (Positive Thinker)', tier: 'B', effect: 'Régénère lentement la santé mentale (SAN)', note: 'Confort à la base, garde le Pal productif.' },
  dietlover:   { name: 'Gourmet léger (Diet Lover)', tier: 'B', effect: 'Consommation de nourriture −10 %', note: 'Utile partout (endurance/nourriture).' },
  element:     { name: 'Boost d’élément (ex : Dragon Divin)', tier: 'S', effect: 'Attaque de l’élément correspondant +20 %', note: 'Passif d’élément assorti au type du Pal (Dragon Divin, etc.). Le meilleur en combat mono-élément.' },
};

// ---------- Modèles de builds (sets de 4 passifs) ----------
export const BUILDS = {
  combat: {
    label: 'Combat',
    icon: '⚔️',
    desc: 'Maximiser les dégâts pour boss/tours et farm.',
    passives: ['legend', 'musclehead', 'ferocious', 'element'],
    fallback: ['musclehead', 'ferocious', 'sadist', 'burly'],
  },
  tank: {
    label: 'Tank / Boss',
    icon: '🛡️',
    desc: 'Survie prolongée face aux boss coriaces.',
    passives: ['legend', 'burly', 'hardskin', 'ferocious'],
    fallback: ['burly', 'hardskin', 'masochist', 'ferocious'],
  },
  mount: {
    label: 'Monture',
    icon: '🐎',
    desc: 'Déplacement rapide (exploration, esquive).',
    passives: ['legend', 'swift', 'runner', 'nimble'],
    fallback: ['swift', 'runner', 'nimble', 'dietlover'],
  },
  work: {
    label: 'Travail (base)',
    icon: '🔨',
    desc: 'Productivité maximale à la base. Évite Costaud.',
    passives: ['artisan', 'lucky', 'serene', 'dietlover'],
    fallback: ['artisan', 'lucky', 'serene', 'dietlover'],
  },
};

// ---------- Heuristique de rôle par Pal ----------
export function recommendRole(p) {
  const workSum = p.suitability.reduce((s, w) => s + w.level, 0);
  const topWork = Math.max(0, ...p.suitability.map((w) => w.level));
  const atk = Math.max(p.stats.atkMelee, p.stats.atkRanged);

  // Légendaires / haute rareté => combat en priorité
  if (p.rarity >= 8) return 'combat';
  // Gros travailleur
  if (topWork >= 4 || workSum >= 9) return 'work';
  // Grosse monture
  if (p.stats.rideSpeed >= 850 && (p.size === 'l' || p.size === 'xl')) return 'mount';
  // Bon combattant
  if (atk >= 100 && p.rarity >= 5) return 'combat';
  // Travailleur correct
  if (workSum >= 5) return 'work';
  return 'combat';
}

export function buildFor(roleKey, p) {
  const b = BUILDS[roleKey];
  // Sur un non-légendaire, remplace le set principal par le fallback (pas de Légende).
  const legendary = p.rarity >= 20;
  const ids = legendary ? b.passives : b.fallback;
  return { role: roleKey, label: b.label, icon: b.icon, desc: b.desc, passives: ids };
}

// ---------- Progression joueur (par palier de niveau) ----------
export const PROGRESSION = [
  {
    id: 'p1', band: 'Niv. 1–10', zone: 'Collines Balayées par le Vent (départ)',
    color: '#5cb85c',
    gear: ['Tenue en tissu → Armure en tissu', 'Arc / Arc ancien, Massue en bois puis Lance en métal', 'Grappin (déplacement)'],
    tech: ['Établi, Palbox, Coffre', 'Feu de camp + Marmite', 'Enclos de capture, Sphères Pal', 'Lit (paille) pour dormir'],
    pals: ['Lifmunk (récolte/artisanat)', 'Cattiva (transport)', 'Foxparks (allumage)', 'Pengullet (arrosage)'],
    boss: 'Tour Rayne — Zoe & Grizzbolt (viser ~niv. 15–18)',
  },
  {
    id: 'p2', band: 'Niv. 10–20', zone: 'Plaines & premières grottes (minerai, charbon)',
    color: '#57c4d6',
    gear: ['Armure en métal', 'Vieil arc à trois flèches, Arbalète', 'Pioche/hache en métal, Torche portable'],
    tech: ['Fourneau primitif (lingots)', 'Établi de haute qualité', 'Ranch, Plantation de baies, Moulin', 'Fabrique de sphères Pal méga'],
    pals: ['Digtoise (minage)', 'Eikthyrdeer (monture + bûcheronnage)', 'Tocotoco (transport/ranged)', 'Mozzarina (lait au ranch)'],
    boss: 'Tour Free Pal Alliance — Lily & Lyleen (viser ~niv. 25–30)',
  },
  {
    id: 'p3', band: 'Niv. 20–30', zone: 'Désert (chaud) & zones électriques',
    color: '#e9c53b',
    gear: ['Armure résistante à la chaleur (désert) / au froid (montagnes)', 'Pistolet, Arbalète à répétition', 'Bouclier'],
    tech: ['Générateur électrique + Pals Foudre', 'Fabrique d’armes à feu', 'Plantation de blé, Boulangerie', 'Réfrigérateur, Coffre réfrigéré'],
    pals: ['Rushoar/Direhowl (montures rapides)', 'Anubis (artisanat élite)', 'Grintale/Beakon', 'Sweepa/Foxcicle (froid)'],
    boss: 'Tour Frères du Bûcher — Marcus & Faleris (viser ~niv. 30–35)',
  },
  {
    id: 'p4', band: 'Niv. 30–40', zone: 'Montagnes enneigées & îles volcaniques',
    color: '#e8663a',
    gear: ['Armure en métal raffiné (chaud/froid selon zone)', 'Fusil à pompe, Fusil d’assaut', 'Casque de plongée pour l’eau profonde'],
    tech: ['Lingots raffinés', 'Ligne d’assemblage électrique', 'Ferme de plantations automatisée (Pals)', 'Pod de vie amélioré'],
    pals: ['Jormuntide (eau, boss)', 'Ragnahawk (monture volante feu)', 'Nitewing (vol)', 'Reptyro/Digtoise (minage lourd)'],
    boss: 'Tour PIDF — Axel & Orserk (viser ~niv. 40–45)',
  },
  {
    id: 'p5', band: 'Niv. 40–50+', zone: 'Îles No.3 / laboratoire & sanctuaires légendaires',
    color: '#7b6cf6',
    gear: ['Armure en pal-métal / carbone', 'Fusil à pompe amélioré, Lance-roquettes', 'Meilleurs accessoires (anneaux stats)'],
    tech: ['Pal-métal & alliage carbone', 'Missile / explosifs', 'Base entièrement automatisée', 'Ferme de fabrication de sphères légendaires'],
    pals: ['Jetragon (monture ultime)', 'Frostallion / Necromus / Paladius', 'Blazamut, Shadowbeak', 'Anubis / Orserk (combat)'],
    boss: 'Tour PAL Genetic — Victor & Shadowbeak (endgame ~niv. 48–50)',
  },
];

// ---------- Guide de fabrication / arbre technologique (essentiels) ----------
export const TECH_TREE = [
  { id: 't1', lvl: 2, name: 'Établi & Coffre', why: 'Débloque tout l’artisanat de base. Priorité absolue.' },
  { id: 't2', lvl: 3, name: 'Sphère Pal', why: 'Capturer des Pals. Améliore-la dès que possible.' },
  { id: 't3', lvl: 4, name: 'Feu de camp + Marmite', why: 'Cuisine → nourriture qui restaure plus de faim/SAN.' },
  { id: 't4', lvl: 5, name: 'Palbox amélioré', why: 'Augmente la limite de Pals à la base (3 → 15+).' },
  { id: 't5', lvl: 6, name: 'Grappin', why: 'Mobilité verticale, exploration, esquive.' },
  { id: 't6', lvl: 7, name: 'Ranch', why: 'Production passive (laine, œufs, lait) via Pals de ranch.' },
  { id: 't7', lvl: 8, name: 'Plantation de baies', why: 'Nourriture auto pour toi et tes Pals à la base.' },
  { id: 't8', lvl: 10, name: 'Fourneau primitif', why: 'Lingots de métal → nails, armes et armures métal.' },
  { id: 't9', lvl: 11, name: 'Sac de nourriture', why: 'Nourrit automatiquement les Pals au travail.' },
  { id: 't10', lvl: 12, name: 'Établi haute qualité', why: 'Débloque équipements de meilleur palier.' },
  { id: 't11', lvl: 14, name: 'Moulin', why: 'Farine → pain (meilleure nourriture).' },
  { id: 't12', lvl: 15, name: 'Boîte de médecine', why: 'Fabriquer soins/antidotes (statuts).' },
  { id: 't13', lvl: 17, name: 'Fabrique de sphères Méga', why: 'Meilleur taux de capture sur Pals de haut niveau.' },
  { id: 't14', lvl: 19, name: 'Établi électrique', why: 'Prérequis aux ateliers automatisés.' },
  { id: 't15', lvl: 20, name: 'Générateur électrique', why: 'Alimente les ateliers électriques (Pal Foudre requis).' },
  { id: 't16', lvl: 23, name: 'Fabrique d’armes à feu', why: 'Pistolet et munitions → gros palier de puissance.' },
  { id: 't17', lvl: 28, name: 'Ligne d’assemblage électrique', why: 'Divise le nombre de Pals requis par recette.' },
  { id: 't18', lvl: 33, name: 'Lingot raffiné', why: 'Armes/armures de haut palier (fusil, métal raffiné).' },
  { id: 't19', lvl: 40, name: 'Fusil à pompe / d’assaut', why: 'Armement endgame pour tours 4–5.' },
  { id: 't20', lvl: 44, name: 'Pal-métal & carbone', why: 'Meilleures armures/accessoires du jeu.' },
];
