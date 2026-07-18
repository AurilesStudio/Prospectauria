// update.js — vérification de mise à jour des données au lancement
import { DB } from './data.js';

const LS_KEY = 'palworld-tracker.update';
const THROTTLE_MS = 12 * 60 * 60 * 1000; // 12 h

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function save(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

export function getStatus() {
  return load();
}

// Lit la version de PalCalc via une requête Range légère (~120 octets)
async function fetchRemoteVersion() {
  const url = DB.meta?.sources?.palcalc?.url;
  if (!url) return null;
  const r = await fetch(url, { headers: { Range: 'bytes=0-160' } });
  const txt = await r.text();
  const m = txt.match(/"Version"\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

// Vérifie s'il existe une nouvelle version des données de jeu (PalCalc).
// force = true ignore le throttle (bouton manuel).
export async function checkForUpdates(force = false) {
  const s = load();
  const now = Date.now();
  if (!force && s.checkedAt && (now - s.checkedAt) < THROTTLE_MS) {
    return { ...s, cached: true };
  }
  const localVersion = DB.meta?.sources?.palcalc?.version || null;
  let result = { ...s, checkedAt: now, localVersion, palworldVersion: DB.meta?.palworldVersion };
  try {
    const remote = await fetchRemoteVersion();
    result.remoteVersion = remote;
    result.updateAvailable = !!(remote && localVersion && remote !== localVersion);
    result.online = true;
  } catch {
    result.online = false;
  }
  save(result);
  return result;
}
