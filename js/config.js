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

// Contrôle d'accès (app privée) :
//  - requireLogin : quand le cloud est configuré, l'app est verrouillée derrière la connexion
//    (un visiteur sans compte ne peut pas l'utiliser).
//  - allowSignup  : autoriser la création de compte depuis l'app. Laisse à `false` pour une
//    app fermée : tu crées toi-même les comptes autorisés dans Supabase (Authentication → Users),
//    et tu désactives « Allow new users to sign up » côté Supabase.
export const AUTH = {
  requireLogin: true,
  allowSignup: false,
};

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
