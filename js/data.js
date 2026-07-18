// data.js — chargement des données de jeu + libellés FR + index

export const EL_FR = {
  neutral: 'Neutre', dark: 'Ténèbres', dragon: 'Dragon', electric: 'Foudre',
  fire: 'Feu', grass: 'Herbe', ground: 'Terre', ice: 'Glace', water: 'Eau',
};

export const EL_COLOR = {
  neutral: '#c9b98f', dark: '#7a5aa8', dragon: '#7b6cf6', electric: '#e9c53b',
  fire: '#e8663a', grass: '#5cb85c', ground: '#c08a4a', ice: '#57c4d6', water: '#3f9be0',
};

export const WORK_FR = {
  kindling: 'Allumage', watering: 'Arrosage', planting: 'Plantation',
  generating_electricity: 'Électricité', handiwork: 'Artisanat', gathering: 'Récolte',
  lumbering: 'Bûcheronnage', mining: 'Minage', medicine_production: 'Médecine',
  cooling: 'Réfrigération', transporting: 'Transport', farming: 'Ranch',
};

export const GENUS_FR = {
  humanoid: 'Humanoïde', bird: 'Oiseau', dragon: 'Dragon', fish: 'Poisson',
  fourlegged: 'Quadrupède', monster: 'Monstre', other: 'Autre',
};

export const SIZE_FR = { xs: 'Très petit', s: 'Petit', m: 'Moyen', l: 'Grand', xl: 'Très grand' };

export function titleCase(s) {
  if (!s) return '';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// État chargé
export const DB = { pals: [], byKey: new Map(), byNameEn: new Map(), breeding: {}, parentsOf: {}, resultOf: new Map(), meta: null };

export async function loadData() {
  const [pals, breeding, meta] = await Promise.all([
    fetchJSON('./data/pals.json'),
    fetchJSON('./data/breeding.json'),
    fetchJSON('./data/meta.json').catch(() => null),
  ]);
  DB.pals = pals;
  DB.meta = meta;
  DB.byKey = new Map(pals.map((p) => [p.key, p]));
  DB.byNameEn = new Map(pals.map((p) => [p.nameEn, p]));
  DB.breeding = breeding; // { childKey: [[parentA, parentB], ...] }
  DB.parentsOf = breeding;

  // Index inverse : "parentA|parentB" -> childKey
  const resultOf = new Map();
  for (const [child, pairs] of Object.entries(breeding)) {
    for (const [a, b] of pairs) {
      resultOf.set(pairKey(a, b), child);
    }
  }
  DB.resultOf = resultOf;
  return DB;
}

function fetchJSON(url) {
  return fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });
}

export function pairKey(a, b) {
  return [a, b].sort().join('|');
}

export function palByNameEn(n) {
  return DB.byNameEn.get(n) || null;
}

// Résultat d'un croisement A + B
export function breedResult(a, b) {
  return DB.resultOf.get(pairKey(a, b)) || null;
}

// Toutes les paires de parents qui donnent `childKey`
export function parentsFor(childKey) {
  return DB.breeding[childKey] || [];
}

export function pal(key) {
  return DB.byKey.get(key) || null;
}

export function palImg(key) {
  return `./assets/pals/${key}.png`;
}
export function elImg(name) {
  return `./assets/elements/${name}.png`;
}
export function workImg(name) {
  return `./assets/works/${name}.png`;
}
