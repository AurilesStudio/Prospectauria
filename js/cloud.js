// cloud.js — synchronisation Supabase (auth + progression) en REST, sans dépendance.
// Sécurité : la clé "anon" est publique ; l'isolation des données repose sur les
// politiques Row Level Security (chaque utilisateur ne lit/écrit que sa propre ligne).
import { config } from './config.js';
import { store } from './store.js';

const SESSION_LS = 'palworld-tracker.session';
let session = loadSession();
let authListeners = [];
let pushTimer = null;
let lastSyncState = null; // 'saving' | 'saved' | 'error' | null

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_LS)) || null; } catch { return null; }
}
function saveSession(s) {
  session = s;
  if (s) localStorage.setItem(SESSION_LS, JSON.stringify(s));
  else localStorage.removeItem(SESSION_LS);
  emitAuth();
}
function emitAuth() { authListeners.forEach((f) => { try { f(currentUser()); } catch {} }); }

export const cloud = {
  get available() { return config.configured; },
  get user() { return currentUser(); },
  get syncState() { return lastSyncState; },
  onAuthChange(fn) { authListeners.push(fn); },

  async signUp(email, password) {
    const r = await authFetch('/auth/v1/signup', { email, password });
    if (!r.ok) return r;
    if (r.data.access_token) { setSessionFromToken(r.data); await onSignedIn(); return { ok: true, session: true }; }
    // Confirmation par email requise
    return { ok: true, session: false, needsConfirm: true };
  },

  async signIn(email, password) {
    const r = await authFetch('/auth/v1/token?grant_type=password', { email, password });
    if (!r.ok) return r;
    setSessionFromToken(r.data);
    await onSignedIn();
    return { ok: true };
  },

  async signOut() {
    try {
      if (session?.access_token) {
        await fetch(config.url + '/auth/v1/logout', {
          method: 'POST', headers: authHeaders(),
        });
      }
    } catch {}
    saveSession(null);
    lastSyncState = null;
  },

  // Appelé au démarrage : restaure la session et tire la progression du cloud.
  async init() {
    if (!config.configured || !session) return;
    const ok = await ensureFreshToken();
    if (!ok) { saveSession(null); return; }
    await pullState();
    emitAuth();
  },

  // Poussée (débouncée) de l'état vers le cloud après une modif locale.
  schedulePush(state) {
    if (!config.configured || !session) return;
    lastSyncState = 'saving'; emitAuth();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushState(state), 1000);
  },

  async pushNow() { if (session) return pushState(store.snapshot()); },
};

function currentUser() {
  return session?.user ? { id: session.user.id, email: session.user.email } : null;
}

function authHeaders(json) {
  const h = { apikey: config.anonKey, Authorization: `Bearer ${session?.access_token || config.anonKey}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function authFetch(path, body) {
  try {
    const res = await fetch(config.url + path, {
      method: 'POST',
      headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.msg || data.error_description || data.error || `Erreur ${res.status}` };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Réseau indisponible' };
  }
}

function setSessionFromToken(d) {
  saveSession({
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
    user: d.user,
  });
}

async function ensureFreshToken() {
  if (!session) return false;
  if (session.expires_at && Date.now() / 1000 < session.expires_at - 60) return true;
  const r = await authFetch('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token });
  if (!r.ok || !r.data.access_token) return false;
  setSessionFromToken(r.data);
  return true;
}

// À la connexion : si le cloud est vide, on y pousse l'état local (pour ne rien perdre) ;
// sinon on récupère l'état du cloud.
async function onSignedIn() {
  const remote = await pullState({ apply: false });
  if (remote === null) return; // erreur réseau : on garde le local
  const hasRemote = remote && Object.keys(remote).length && anyProgress(remote);
  if (hasRemote) {
    store.hydrate(remote);
  } else {
    await pushState(store.snapshot());
  }
  emitAuth();
}

function anyProgress(s) {
  return ['owned', 'favorites', 'notes', 'tasks', 'counters'].some((k) => s[k] && Object.keys(s[k]).length)
    || (s.objectives && s.objectives.length);
}

async function pullState({ apply = true } = {}) {
  if (!(await ensureFreshToken())) { saveSession(null); return null; }
  try {
    const uid = session.user.id;
    const res = await fetch(`${config.url}/rest/v1/progress?user_id=eq.${uid}&select=state`, { headers: authHeaders() });
    if (!res.ok) return null;
    const rows = await res.json();
    const remote = rows[0]?.state || {};
    if (apply && anyProgress(remote)) store.hydrate(remote);
    return remote;
  } catch { return null; }
}

async function pushState(state) {
  if (!(await ensureFreshToken())) { saveSession(null); lastSyncState = 'error'; emitAuth(); return; }
  try {
    const uid = session.user.id;
    const res = await fetch(`${config.url}/rest/v1/progress?on_conflict=user_id`, {
      method: 'POST',
      headers: { ...authHeaders(true), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ user_id: uid, state, updated_at: new Date().toISOString() }]),
    });
    lastSyncState = res.ok ? 'saved' : 'error';
  } catch {
    lastSyncState = 'error';
  }
  emitAuth();
}
