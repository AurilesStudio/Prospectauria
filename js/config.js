// config.js — configuration Supabase
//
// Pour un déploiement partagé (ex: GitHub Pages), renseigne ici l'URL du projet
// et la clé "anon public" (elle est conçue pour être publique — la sécurité est
// assurée par les règles Row Level Security côté Supabase). Voir supabase/README.md.
//
// Alternative : laisser vide et saisir ces valeurs dans l'app (⚙️ Compte → Configurer),
// elles seront mémorisées dans le navigateur.

const SUPABASE_URL = '';       // ex: 'https://xxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = '';  // ex: 'eyJhbGciOi...'

const LS = 'palworld-tracker.supabase';

function saved() {
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; }
}

export const config = {
  get url() { return (saved().url || SUPABASE_URL || '').replace(/\/$/, ''); },
  get anonKey() { return saved().anonKey || SUPABASE_ANON_KEY || ''; },
  get configured() { return !!(this.url && this.anonKey); },
  get bakedIn() { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); },
  save(url, anonKey) {
    localStorage.setItem(LS, JSON.stringify({ url: (url || '').trim(), anonKey: (anonKey || '').trim() }));
  },
  clear() { localStorage.removeItem(LS); },
};
