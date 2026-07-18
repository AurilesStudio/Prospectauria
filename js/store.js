// store.js — persistance locale (localStorage)

const KEY = 'palworld-tracker.v1';

const DEFAULT = {
  owned: {},      // { palKey: true }
  favorites: {},  // { palKey: true }
  notes: {},      // { palKey: "texte" }
  tasks: {},      // { taskId: true }  (progression joueur / fabrications / boss)
  counters: {},   // { effigies: n, ... }
  objectives: [], // [{ id, text, done, cat }]
};

let state = load();
let onPersist = null; // hook cloud (appelé après chaque modif locale de l'utilisateur)

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function persist(silent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Sauvegarde impossible', e);
  }
  if (!silent && onPersist) { try { onPersist(state); } catch {} }
}

export const store = {
  get: () => state,

  isOwned: (k) => !!state.owned[k],
  toggleOwned(k) {
    if (state.owned[k]) delete state.owned[k];
    else state.owned[k] = true;
    persist();
    return !!state.owned[k];
  },
  setOwned(k, v) {
    if (v) state.owned[k] = true;
    else delete state.owned[k];
    persist();
  },

  isFav: (k) => !!state.favorites[k],
  toggleFav(k) {
    if (state.favorites[k]) delete state.favorites[k];
    else state.favorites[k] = true;
    persist();
    return !!state.favorites[k];
  },

  note: (k) => state.notes[k] || '',
  setNote(k, txt) {
    if (txt && txt.trim()) state.notes[k] = txt;
    else delete state.notes[k];
    persist();
  },

  isTaskDone: (id) => !!state.tasks[id],
  toggleTask(id) {
    if (state.tasks[id]) delete state.tasks[id];
    else state.tasks[id] = true;
    persist();
    return !!state.tasks[id];
  },

  ownedCount: () => Object.keys(state.owned).length,
  tasksDoneCount: (prefix) => Object.keys(state.tasks).filter((k) => k.startsWith(prefix)).length,

  counter: (id) => state.counters[id] || 0,
  setCounter(id, v) {
    state.counters[id] = Math.max(0, Number(v) || 0);
    persist();
  },

  objectives: () => state.objectives,
  addObjective(text, cat) {
    state.objectives.push({ id: 'o' + Date.now() + Math.floor(Math.random() * 1e4), text, cat: cat || 'Général', done: false });
    persist();
  },
  toggleObjective(id) {
    const o = state.objectives.find((x) => x.id === id);
    if (o) { o.done = !o.done; persist(); }
  },
  removeObjective(id) {
    state.objectives = state.objectives.filter((x) => x.id !== id);
    persist();
  },

  exportJSON: () => JSON.stringify(state, null, 2),
  importJSON(json) {
    const data = JSON.parse(json);
    state = { ...structuredClone(DEFAULT), ...data };
    persist();
  },
  reset() {
    state = structuredClone(DEFAULT);
    persist();
  },

  // --- Intégration cloud ---
  snapshot: () => structuredClone(state),
  setPersistHook(fn) { onPersist = fn; },
  // Remplace l'état local par celui du cloud (sans re-déclencher la synchro).
  hydrate(obj) {
    state = { ...structuredClone(DEFAULT), ...(obj || {}) };
    persist(true);
  },
};
