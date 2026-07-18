// app.js — UI et interactions
import {
  DB, loadData, pal, palByNameEn, palImg, elImg, workImg, parentsFor, breedResult,
  EL_FR, EL_COLOR, WORK_FR, GENUS_FR, SIZE_FR, titleCase,
} from './data.js';
import { store } from './store.js';
import { PASSIVES, BUILDS, PROGRESSION, TECH_TREE, BOSSES, COUNTERS, recommendRole, buildFor } from './content.js';
import { checkForUpdates, getStatus } from './update.js';

const $ = (s, r = document) => r.querySelector(s);
const view = () => $('#view');

const stats_ = { maxHp: 1, maxAtk: 1, maxDef: 1, maxRide: 1 };
const ui = {
  tab: 'accueil',
  search: '',
  fType: null,
  fWork: null,
  fOwn: 'all', // all | owned | missing
  fFav: false,
  breedMode: 'result', // result | target
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- badges & vignettes ----------
function typeBadges(p) {
  if (!p.types || !p.types.length) {
    return '<span class="badge unknown" title="Élément non encore renseigné (données 1.0)">? élément</span>';
  }
  return p.types.map((t) => `<span class="badge" style="background:${EL_COLOR[t] || '#555'}">
    <img src="${elImg(t)}" alt=""> ${EL_FR[t] || t}</span>`).join('');
}

// Vignette d'un Pal (image ou placeholder coloré si absente)
function thumb(p, cls = '') {
  if (p && p.hasImage) return `<img loading="lazy" class="${cls}" src="${palImg(p.key)}" alt="${esc(p.name)}">`;
  const col = p && p.types && p.types[0] ? EL_COLOR[p.types[0]] : '#39445e';
  return `<span class="noimg ${cls}" style="--c:${col}">#${p ? p.id : '?'}</span>`;
}
function thumbKey(key, cls = '') { return thumb(pal(key), cls); }
function workChips(p) {
  return [...p.suitability].sort((a, b) => b.level - a.level).map((w) => `
    <span class="work" title="${WORK_FR[w.type] || w.type}">
      <img src="${workImg(w.type)}" alt=""><span class="lvl">${w.level}</span>
      <span class="wname">${WORK_FR[w.type] || w.type}</span></span>`).join('');
}

// ---------- Paldex ----------
function matchesFilters(p) {
  if (ui.search) {
    const q = ui.search.toLowerCase();
    if (!(p.name.toLowerCase().includes(q) || (p.nameEn || '').toLowerCase().includes(q) || String(p.id).includes(q))) return false;
  }
  if (ui.fType && !p.types.includes(ui.fType)) return false;
  if (ui.fWork && !p.suitability.some((w) => w.type === ui.fWork)) return false;
  if (ui.fFav && !store.isFav(p.key)) return false;
  if (ui.fOwn === 'owned' && !store.isOwned(p.key)) return false;
  if (ui.fOwn === 'missing' && store.isOwned(p.key)) return false;
  return true;
}

function renderPaldex() {
  const owned = store.ownedCount();
  const total = DB.pals.length;
  const pct = Math.round((owned / total) * 100);
  const list = DB.pals.filter(matchesFilters);

  const typeChips = Object.keys(EL_FR).map((t) => `
    <button class="chip ${ui.fType === t ? 'on' : ''}" data-ftype="${t}"
      style="${ui.fType === t ? `background:${EL_COLOR[t]};border-color:${EL_COLOR[t]}` : ''}">
      <img src="${elImg(t)}" alt="">${EL_FR[t]}</button>`).join('');
  const workChipsBar = Object.keys(WORK_FR).map((w) => `
    <button class="chip ${ui.fWork === w ? 'on' : ''}" data-fwork="${w}">
      <img src="${workImg(w)}" alt="">${WORK_FR[w]}</button>`).join('');

  view().innerHTML = `
    <div class="progress-head">
      <div class="progress-label"><b>${owned}</b> / ${total} Pals capturés <span class="muted">(${pct}%)</span></div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="toolbar">
      <input id="search" class="search" placeholder="🔎 Rechercher un Pal…" value="${esc(ui.search)}">
      <div class="seg">
        <button class="seg-btn ${ui.fOwn === 'all' ? 'on' : ''}" data-fown="all">Tous</button>
        <button class="seg-btn ${ui.fOwn === 'owned' ? 'on' : ''}" data-fown="owned">Obtenus</button>
        <button class="seg-btn ${ui.fOwn === 'missing' ? 'on' : ''}" data-fown="missing">Manquants</button>
      </div>
      <button class="seg-btn ${ui.fFav ? 'on' : ''}" data-ffav>★ Favoris</button>
    </div>
    <div class="chips">${typeChips}</div>
    <div class="chips">${workChipsBar}</div>
    <div class="count muted">${list.length} résultat(s)</div>
    <div class="grid">
      ${list.map(palCard).join('') || '<div class="empty">Aucun Pal ne correspond aux filtres.</div>'}
    </div>`;
}

function palCard(p) {
  const own = store.isOwned(p.key);
  const fav = store.isFav(p.key);
  return `<div class="card ${own ? 'owned' : ''}" data-pal="${p.key}">
    <button class="star ${fav ? 'on' : ''}" data-fav="${p.key}" title="Favori">★</button>
    <div class="card-img">${thumb(p)}
      ${p.isVariant ? '<span class="vtag" title="Variante">✦</span>' : ''}
      ${own ? '<span class="check">✓</span>' : ''}</div>
    <div class="dex">#${p.id}</div>
    <div class="pname">${esc(p.name)}</div>
    <div class="badges">${typeBadges(p)}</div>
  </div>`;
}

// ---------- Detail modal ----------
function statBar(label, val, max) {
  const w = Math.min(100, Math.round((val / max) * 100));
  return `<div class="stat"><span class="stat-l">${label}</span>
    <span class="stat-bar"><span style="width:${w}%"></span></span>
    <span class="stat-v">${val}</span></div>`;
}

function passiveTag(id) {
  const p = PASSIVES[id];
  if (!p) return '';
  return `<div class="passive tier-${p.tier}">
    <div class="p-top"><span class="p-name">${esc(p.name)}</span><span class="p-tier">${p.tier}</span></div>
    <div class="p-eff">${esc(p.effect)}</div>
    ${p.note ? `<div class="p-note">${esc(p.note)}</div>` : ''}
  </div>`;
}

function breedingParentsBlock(p) {
  const pairs = parentsFor(p.key);
  if (!pairs.length) {
    if (!p.hasBreeding) {
      return '<p class="muted">🔄 Recettes de breeding non encore disponibles pour ce Pal 1.0. Elles seront ajoutées à la prochaine mise à jour des données.</p>';
    }
    return '<p class="muted">Aucune recette de breeding connue (capture uniquement, ou œuf).</p>';
  }
  const shown = pairs.slice(0, 40);
  const rows = shown.map(([a, b]) => {
    const pa = pal(a), pb = pal(b);
    if (!pa || !pb) return '';
    return `<div class="combo">
      <span class="mini" data-pal="${a}">${thumb(pa, 'mini-img')} ${esc(pa.name)}</span>
      <span class="plus">+</span>
      <span class="mini" data-pal="${b}">${thumb(pb, 'mini-img')} ${esc(pb.name)}</span>
    </div>`;
  }).join('');
  const more = pairs.length > shown.length ? `<div class="muted">… +${pairs.length - shown.length} autres combinaisons</div>` : '';
  return `<div class="combos">${rows}${more}</div>`;
}

function openDetail(key) {
  const p = pal(key);
  if (!p) return;
  const own = store.isOwned(key);
  const fav = store.isFav(key);
  const role = recommendRole(p);
  const build = buildFor(role, p);

  const body = `
    <div class="detail">
      <div class="detail-head">
        ${thumb(p, 'dimg')}
        <div class="dmeta">
          <div class="dtitle">#${p.id} · ${esc(p.name)}
            ${p.isVariant ? '<span class="chip-tag">Variante</span>' : ''}
            ${p.predator ? '<span class="chip-tag pred">Prédateur</span>' : ''}
            <button class="star ${fav ? 'on' : ''}" data-fav="${p.key}">★</button></div>
          <div class="muted small">${p.nameEn !== p.name ? esc(p.nameEn) + ' · ' : ''}${p.wildLevel && p.wildLevel[0] ? `Niv. sauvage ${p.wildLevel[0]}–${p.wildLevel[1]}` : ''}</div>
          <div class="badges">${typeBadges(p)}</div>
          <div class="muted small">${GENUS_FR[p.genus] || p.genus} · ${SIZE_FR[p.size] || p.size} · Rareté ${p.rarity}${p.rarity >= 10 ? ' ★' : ''}${p.nocturnal ? ' · 🌙 Nocturne' : ''}</div>
          <button class="own-btn ${own ? 'on' : ''}" data-toggleown="${p.key}">
            ${own ? '✓ Obtenu' : '+ Marquer comme obtenu'}</button>
        </div>
      </div>

      <div class="dsection"><h4>📊 Statistiques</h4>
        ${statBar('PV', p.stats.hp, stats_.maxHp)}
        ${statBar('Atq. mêlée', p.stats.atkMelee, stats_.maxAtk)}
        ${statBar('Atq. distance', p.stats.atkRanged, stats_.maxAtk)}
        ${statBar('Défense', p.stats.defense, stats_.maxDef)}
        ${statBar('Vit. monture', p.stats.rideSpeed, stats_.maxRide)}
        <div class="muted small">Nourriture : ${p.stats.food}/10</div>
      </div>

      ${p.suitability.length ? `<div class="dsection"><h4>🔧 Aptitudes de travail</h4>
        <div class="works">${workChips(p)}</div></div>` : ''}

      ${p.partnerSkill && p.partnerSkill.name ? `<div class="dsection"><h4>🤝 Compétence de partenaire — ${esc(p.partnerSkill.name)}</h4>
        <p class="muted small">${esc(p.partnerSkill.description || '')}</p></div>` : ''}

      <div class="dsection reco">
        <h4>✨ Passifs conseillés — ${build.icon} ${build.label}</h4>
        <p class="muted small">${esc(build.desc)}</p>
        <div class="passives">${build.passives.map(passiveTag).join('')}</div>
        <p class="muted small">Autres rôles possibles :
          ${Object.keys(BUILDS).filter((k) => k !== role).map((k) => `<button class="link-btn" data-altbuild="${p.key}:${k}">${BUILDS[k].icon} ${BUILDS[k].label}</button>`).join(' · ')}</p>
        <div id="alt-build"></div>
      </div>

      <div class="dsection"><h4>🥚 Breeding — parents qui donnent ${esc(p.name)}</h4>
        ${breedingParentsBlock(p)}</div>

      <div class="dsection"><h4>📝 Notes personnelles</h4>
        <textarea id="note" data-note="${p.key}" placeholder="Ex : lignée de breeding, passifs déjà obtenus…">${esc(store.note(key))}</textarea>
      </div>

      <p class="muted small det">${esc(p.description || '')}</p>
    </div>`;
  showModal(body);
}

function showAltBuild(key, roleKey) {
  const p = pal(key);
  const b = buildFor(roleKey, p);
  $('#alt-build').innerHTML = `<div class="alt">
    <h5>${b.icon} ${b.label} <span class="muted small">— ${esc(b.desc)}</span></h5>
    <div class="passives">${b.passives.map(passiveTag).join('')}</div></div>`;
}

// ---------- Breeding tab ----------
function palOptions(sel) {
  return DB.pals.map((p) => `<option value="${p.key}" ${sel === p.key ? 'selected' : ''}>#${p.key} · ${esc(p.name)}</option>`).join('');
}

let bA = null, bB = null, bTarget = null;

function renderBreeding() {
  view().innerHTML = `
    <div class="seg big">
      <button class="seg-btn ${ui.breedMode === 'result' ? 'on' : ''}" data-bmode="result">A + B = ?</button>
      <button class="seg-btn ${ui.breedMode === 'target' ? 'on' : ''}" data-bmode="target">Comment obtenir un Pal ?</button>
    </div>
    <div id="breed-body"></div>`;
  renderBreedBody();
}

function renderBreedBody() {
  const el = $('#breed-body');
  if (ui.breedMode === 'result') {
    el.innerHTML = `
      <div class="breed-calc">
        <select id="bA" class="pal-select">${palOptions(bA)}</select>
        <span class="plus big">+</span>
        <select id="bB" class="pal-select">${palOptions(bB)}</select>
      </div>
      <div id="breed-result" class="breed-result"></div>`;
    computeBreedResult();
  } else {
    el.innerHTML = `
      <div class="breed-calc">
        <select id="bTarget" class="pal-select wide">${palOptions(bTarget)}</select>
      </div>
      <div id="breed-target" class="breed-target"></div>`;
    computeBreedTarget();
  }
}

function resultCard(key) {
  const p = pal(key);
  return `<div class="rcard" data-pal="${key}">
    ${thumb(p, 'rimg')}<div><div class="rname">#${p.id} · ${esc(p.name)}</div>
    <div class="badges">${typeBadges(p)}</div></div></div>`;
}

function computeBreedResult() {
  bA = $('#bA')?.value || bA || DB.pals[0].key;
  bB = $('#bB')?.value || bB || DB.pals[0].key;
  const child = breedResult(bA, bB);
  const box = $('#breed-result');
  if (!box) return;
  if (!child) {
    box.innerHTML = '<div class="empty">Combinaison sans résultat répertorié.</div>';
    return;
  }
  box.innerHTML = `<div class="arrow">↓ donne ↓</div>${resultCard(child)}`;
}

function computeBreedTarget() {
  bTarget = $('#bTarget')?.value || bTarget || DB.pals[0].key;
  const p = pal(bTarget);
  const box = $('#breed-target');
  if (!box) return;
  const owned = store.isOwned(bTarget);
  box.innerHTML = `
    <div class="target-head">${resultCard(bTarget)}
      <button class="own-btn ${owned ? 'on' : ''}" data-toggleown="${bTarget}">${owned ? '✓ Obtenu' : '+ Marquer obtenu'}</button></div>
    <h4>Combinaisons de parents (${parentsFor(bTarget).length})</h4>
    ${breedingParentsBlock(p)}`;
}

// ---------- Passifs tab ----------
function renderPassifs() {
  const builds = Object.entries(BUILDS).map(([k, b]) => `
    <div class="build-card">
      <h3>${b.icon} ${b.label}</h3>
      <p class="muted small">${esc(b.desc)}</p>
      <div class="passives">${b.passives.map(passiveTag).join('')}</div>
      <p class="muted small">Sans légendaire : ${b.fallback.map((id) => PASSIVES[id]?.name.split(' (')[0]).join(', ')}</p>
    </div>`).join('');

  const catalog = Object.values(PASSIVES).sort((a, b) => a.tier.localeCompare(b.tier)).map((p) => `
    <tr class="tier-row tier-${p.tier}"><td><b>${esc(p.name)}</b></td><td class="tc">${p.tier}</td>
      <td>${esc(p.effect)}</td><td class="muted small">${esc(p.note || '')}</td></tr>`).join('');

  view().innerHTML = `
    <div class="intro"><h2>✨ Guide des passifs</h2>
      <p class="muted">Vise 4 passifs sur tes meilleurs Pals via le breeding (chaque parent a une chance de transmettre ses passifs). Voici les builds méta selon le rôle.</p></div>
    <div class="builds">${builds}</div>
    <h3 class="mt">📖 Catalogue des passifs clés</h3>
    <div class="table-wrap"><table class="ptable">
      <thead><tr><th>Passif</th><th>Tier</th><th>Effet</th><th>Note</th></tr></thead>
      <tbody>${catalog}</tbody></table></div>`;
}

// ---------- Progression joueur ----------
function renderJoueur() {
  const cards = PROGRESSION.map((b) => {
    const bossDone = store.isTaskDone('boss-' + b.id);
    const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join('');
    return `<div class="prog-card" style="--accent:${b.color}">
      <div class="prog-head"><span class="band">${b.band}</span><span class="zone">${esc(b.zone)}</span></div>
      <div class="prog-grid">
        <div><h5>🛡️ Équipement</h5><ul>${li(b.gear)}</ul></div>
        <div><h5>🔧 Ateliers / Tech</h5><ul>${li(b.tech)}</ul></div>
        <div><h5>🐾 Pals utiles</h5><ul>${li(b.pals)}</ul></div>
      </div>
      <label class="boss ${bossDone ? 'done' : ''}"><input type="checkbox" data-task="boss-${b.id}" ${bossDone ? 'checked' : ''}>
        👑 ${esc(b.boss)}</label>
    </div>`;
  }).join('');
  view().innerHTML = `
    <div class="intro"><h2>🛡️ Progression du joueur</h2>
      <p class="muted">Quel équipement fabriquer selon la zone et le niveau, et les boss de tour comme jalons.</p></div>
    ${cards}`;
}

// ---------- Fabrications / Tech ----------
function renderFabrications() {
  const done = TECH_TREE.filter((t) => store.isTaskDone('tech-' + t.id)).length;
  const rows = TECH_TREE.map((t) => {
    const d = store.isTaskDone('tech-' + t.id);
    return `<label class="tech-row ${d ? 'done' : ''}">
      <input type="checkbox" data-task="tech-${t.id}" ${d ? 'checked' : ''}>
      <span class="tlvl">Niv. ${t.lvl}</span>
      <span class="tname">${esc(t.name)}</span>
      <span class="twhy muted small">${esc(t.why)}</span></label>`;
  }).join('');
  view().innerHTML = `
    <div class="intro"><h2>🔧 Guide de fabrication (Tech Tree)</h2>
      <p class="muted">Ordre de déblocage conseillé des ateliers et technologies. Coche au fur et à mesure.</p>
      <div class="bar small"><div class="bar-fill" style="width:${Math.round(done / TECH_TREE.length * 100)}%"></div></div>
      <div class="muted small">${done} / ${TECH_TREE.length} débloqués</div></div>
    <div class="tech-list">${rows}</div>`;
}

// ---------- Accueil / Tableau de bord ----------
function ringCard(label, done, total, tab, color) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<button class="stat-card" data-goto="${tab}">
    <div class="ring" style="--pct:${pct};--rc:${color}"><span>${pct}%</span></div>
    <div class="sc-label">${label}</div><div class="sc-sub muted">${done} / ${total}</div>
  </button>`;
}

function renderAccueil() {
  const pals = store.ownedCount();
  const total = DB.pals.length;
  const towersDone = PROGRESSION.filter((b) => store.isTaskDone('boss-' + b.id)).length;
  const alphaDone = BOSSES.filter((b) => store.isTaskDone('alpha-' + b.id)).length;
  const bossDone = towersDone + alphaDone;
  const bossTotal = PROGRESSION.length + BOSSES.length;
  const techDone = TECH_TREE.filter((t) => store.isTaskDone('tech-' + t.id)).length;
  const obj = store.objectives();
  const objDone = obj.filter((o) => o.done).length;
  const favs = Object.keys(store.get().favorites).length;

  const counters = COUNTERS.map((c) => {
    const v = store.counter(c.id);
    const pct = Math.round((Math.min(v, c.max) / c.max) * 100);
    return `<div class="counter">
      <div class="cnt-top"><span>${c.icon} ${c.label}</span>
        <span class="cnt-val"><button class="cbtn" data-cinc="${c.id}:-1">−</button>
          <input class="cinput" type="number" min="0" max="${c.max}" value="${v}" data-counter="${c.id}">
          <span class="muted">/ ${c.max}</span>
          <button class="cbtn" data-cinc="${c.id}:1">+</button></span></div>
      <div class="bar small"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="muted small">${c.help}</div></div>`;
  }).join('');

  const todo = obj.filter((o) => !o.done).slice(0, 6);
  const todoHtml = todo.length
    ? todo.map((o) => `<li><label><input type="checkbox" data-obj="${o.id}"> ${esc(o.text)} <span class="muted small">· ${esc(o.cat)}</span></label></li>`).join('')
    : '<li class="muted">Aucun objectif en cours — ajoute-en dans l’onglet 🎯 Objectifs.</li>';

  view().innerHTML = `
    <div class="intro"><h2>🏠 Tableau de bord</h2>
      <p class="muted">Vue d’ensemble de ta progression. Clique une carte pour aller au détail.</p></div>
    <div class="stat-cards">
      ${ringCard('📕 Pals capturés', pals, total, 'paldex', '#4dd0a7')}
      ${ringCard('👑 Boss vaincus', bossDone, bossTotal, 'boss', '#e9c53b')}
      ${ringCard('🔧 Technologies', techDone, TECH_TREE.length, 'fabrications', '#7b6cf6')}
      ${ringCard('🎯 Objectifs', objDone, obj.length || 0, 'objectifs', '#e8663a')}
    </div>
    <div class="dash-grid">
      <div class="dash-box"><h3>🗿 Collectibles</h3>${counters}</div>
      <div class="dash-box"><h3>🎯 Prochains objectifs</h3><ul class="todo">${todoHtml}</ul>
        <button class="link-btn" data-goto="objectifs">Gérer mes objectifs →</button></div>
    </div>
    ${dataBox()}`;
}

function dataBox() {
  const m = DB.meta || {};
  const c = m.counts || {};
  const s = getStatus();
  const total = DB.pals.length;
  const last = s.checkedAt ? new Date(s.checkedAt).toLocaleString('fr-FR') : 'jamais';
  const state = s.online === false ? '<span class="muted">hors ligne</span>'
    : s.updateAvailable ? '<span class="upd">mise à jour dispo</span>'
    : s.checkedAt ? '<span class="ok">à jour ✓</span>' : '';
  return `<div class="dash-box data-box"><h3>🗃️ Données &amp; mises à jour</h3>
    <div class="muted small">Palworld ${esc(m.palworldVersion || '?')} · dataset ${esc(m.datasetBuild || '?')} (PalCalc ${esc(m.sources?.palcalc?.version || '?')})</div>
    <div class="cov">
      <span>${total} Pals</span><span>${c.withImage || 0} avec image</span>
      <span>${c.withElement || 0} avec élément</span><span>${c.withBreeding || 0} avec breeding</span>
    </div>
    <div class="muted small">Dernière vérification : ${last} · ${state}</div>
    <button class="tool-btn" data-checkupdates>🔄 Vérifier les mises à jour</button></div>`;
}

// ---------- Base : meilleurs Pals par tâche ----------
let baseOwnedOnly = false;
function renderBase() {
  const works = Object.keys(WORK_FR);
  const sections = works.map((w) => {
    let list = DB.pals
      .filter((p) => p.suitability.some((s) => s.type === w))
      .map((p) => ({ p, lvl: p.suitability.find((s) => s.type === w).level }))
      .sort((a, b) => b.lvl - a.lvl || a.p.id - b.p.id);
    if (baseOwnedOnly) list = list.filter((x) => store.isOwned(x.p.key));
    list = list.slice(0, 10);
    const rows = list.map(({ p, lvl }) => `
      <div class="wp-row ${store.isOwned(p.key) ? 'own' : ''}" data-pal="${p.key}">
        ${thumb(p, 'wp-img')}<span class="wp-name">${esc(p.name)}</span>
        <span class="wp-lvl">Niv. ${lvl}</span>${store.isOwned(p.key) ? '<span class="wp-check">✓</span>' : ''}</div>`).join('')
      || '<div class="muted small">Aucun de tes Pals pour cette tâche.</div>';
    return `<div class="wp-card"><div class="wp-head"><img src="${workImg(w)}" alt="">${WORK_FR[w]}</div>${rows}</div>`;
  }).join('');
  view().innerHTML = `
    <div class="intro"><h2>⚒️ Base — meilleurs Pals par tâche</h2>
      <p class="muted">Qui affecter à chaque poste de travail (trié par niveau d’aptitude).</p>
      <button class="seg-btn ${baseOwnedOnly ? 'on' : ''}" data-baseowned>Seulement mes Pals obtenus</button></div>
    <div class="wp-grid">${sections}</div>`;
}

// ---------- Boss ----------
function bossRow(b, taskId, palName, meta) {
  const done = store.isTaskDone(taskId);
  const p = palName ? palByNameEn(palName) : null;
  const img = p ? `<span class="brimg-wrap" data-pal="${p.key}">${thumb(p, 'brimg')}</span>` : '<span class="brimg ph">👑</span>';
  return `<label class="boss-row ${done ? 'done' : ''} ${b.tier === 'legend' ? 'legend' : ''}">
    <input type="checkbox" data-task="${taskId}" ${done ? 'checked' : ''}>
    ${img}<span class="br-name">${esc(b.name)}</span><span class="br-meta muted small">${esc(meta)}</span></label>`;
}
function renderBoss() {
  const towers = PROGRESSION.map((b) => bossRow({ name: b.boss.split(' — ')[1] || b.boss, tier: 'tower' }, 'boss-' + b.id, null, '')).join('');
  const alphas = BOSSES.map((b) => bossRow(b, 'alpha-' + b.id, b.name, `Niv. ~${b.lvl} · ${b.region}`)).join('');
  const tDone = PROGRESSION.filter((b) => store.isTaskDone('boss-' + b.id)).length;
  const aDone = BOSSES.filter((b) => store.isTaskDone('alpha-' + b.id)).length;
  const tot = PROGRESSION.length + BOSSES.length; const done = tDone + aDone;
  view().innerHTML = `
    <div class="intro"><h2>👑 Boss & défis</h2>
      <p class="muted">Tours (jalons de progression) et boss de terrain / légendaires. Niveaux indicatifs.</p>
      <div class="bar small"><div class="bar-fill" style="width:${Math.round(done / tot * 100)}%"></div></div>
      <div class="muted small">${done} / ${tot} vaincus</div></div>
    <h3 class="mt">🗼 Tours (bosses de tour)</h3><div class="boss-list">${towers}</div>
    <h3 class="mt">⚔️ Boss de terrain & légendaires</h3><div class="boss-list">${alphas}</div>`;
}

// ---------- Objectifs personnels ----------
const OBJ_CATS = ['Général', 'Pals', 'Breeding', 'Base', 'Boss', 'Exploration', 'Équipement'];
const OBJ_SUGGEST = [
  'Compléter le Paldex à 100 %',
  'Obtenir un Pal de combat avec 4 passifs S',
  'Débloquer toutes les tours',
  'Monter une base 100 % automatisée',
  'Capturer les 4 légendaires',
];
function renderObjectifs() {
  const obj = store.objectives();
  const done = obj.filter((o) => o.done).length;
  const byCat = {};
  for (const o of obj) (byCat[o.cat] ||= []).push(o);
  const cats = Object.keys(byCat).sort();
  const list = cats.map((c) => `
    <div class="obj-cat"><h4>${esc(c)}</h4>
      ${byCat[c].map((o) => `<label class="obj-row ${o.done ? 'done' : ''}">
        <input type="checkbox" data-obj="${o.id}" ${o.done ? 'checked' : ''}>
        <span>${esc(o.text)}</span>
        <button class="obj-del" data-objdel="${o.id}" title="Supprimer">✕</button></label>`).join('')}
    </div>`).join('') || '<p class="muted">Aucun objectif pour l’instant. Ajoute le tien ci-dessus ou choisis une suggestion.</p>';

  view().innerHTML = `
    <div class="intro"><h2>🎯 Mes objectifs</h2>
      <p class="muted">Ta to-do Palworld personnelle. ${obj.length ? `${done}/${obj.length} atteints.` : ''}</p></div>
    <div class="obj-add">
      <input id="obj-text" class="search" placeholder="Nouvel objectif…">
      <select id="obj-cat" class="pal-select">${OBJ_CATS.map((c) => `<option>${c}</option>`).join('')}</select>
      <button id="obj-add-btn" class="seg-btn on">+ Ajouter</button></div>
    <div class="suggest">${OBJ_SUGGEST.map((s) => `<button class="chip" data-objsuggest="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div>
    <div class="obj-list">${list}</div>`;
}

// ---------- Bandeau de mise à jour ----------
function renderUpdateBanner() {
  const box = document.getElementById('update-banner');
  if (!box) return;
  const s = getStatus();
  if (s.updateAvailable) {
    box.innerHTML = `<div class="ub">🔄 De nouvelles données Palworld sont disponibles
      (PalCalc ${esc(s.remoteVersion)} vs ${esc(s.localVersion)}). Les prochains Pals/recettes seront intégrés à la prochaine mise à jour du dataset.
      <button class="ub-x" data-ubclose>✕</button></div>`;
    box.style.display = '';
  } else {
    box.style.display = 'none';
  }
}

async function runUpdateCheck(force) {
  const btn = document.querySelector('[data-checkupdates]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Vérification…'; }
  await checkForUpdates(force);
  renderUpdateBanner();
  if (ui.tab === 'accueil') renderAccueil();
  if (btn) { btn.disabled = false; btn.textContent = '🔄 Vérifier les mises à jour'; }
}

// ---------- Modal plumbing ----------
function showModal(html) {
  $('#modal-body').innerHTML = html;
  $('#modal').classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  $('#modal').classList.remove('open');
  document.body.classList.remove('no-scroll');
}

// ---------- Router ----------
const TABS = {
  accueil: renderAccueil, paldex: renderPaldex, breeding: renderBreeding, passifs: renderPassifs,
  base: renderBase, boss: renderBoss, joueur: renderJoueur, fabrications: renderFabrications,
  objectifs: renderObjectifs,
};
function render() {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  (TABS[ui.tab] || renderAccueil)();
}

// ---------- Events ----------
function wire() {
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.addEventListener('click', () => { ui.tab = b.dataset.tab; render(); window.scrollTo(0, 0); }));

  $('#modal-close').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Export / import / reset
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'palworld-tracker-sauvegarde.json';
    a.click();
  });
  $('#file-import').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { store.importJSON(await f.text()); render(); alert('Sauvegarde importée ✓'); }
    catch { alert('Fichier invalide.'); }
    e.target.value = '';
  });

  // Délégation globale de clics
  document.addEventListener('click', (e) => {
    const t = e.target;
    const fav = t.closest('[data-fav]');
    if (fav) { e.stopPropagation(); store.toggleFav(fav.dataset.fav); fav.classList.toggle('on'); if (ui.tab === 'paldex') render(); return; }

    const own = t.closest('[data-toggleown]');
    if (own) { const k = own.dataset.toggleown; const now = store.toggleOwned(k);
      own.classList.toggle('on', now); own.textContent = now ? '✓ Obtenu' : (own.classList.contains('own-btn') ? '+ Marquer comme obtenu' : '+ Marquer obtenu'); return; }

    const card = t.closest('[data-pal]');
    if (card && !t.closest('[data-fav]')) {
      if (t.closest('.boss-row')) e.preventDefault();
      openDetail(card.dataset.pal); return;
    }

    const alt = t.closest('[data-altbuild]');
    if (alt) { const [k, r] = alt.dataset.altbuild.split(':'); showAltBuild(k, r); return; }

    const ftype = t.closest('[data-ftype]');
    if (ftype) { ui.fType = ui.fType === ftype.dataset.ftype ? null : ftype.dataset.ftype; render(); return; }
    const fwork = t.closest('[data-fwork]');
    if (fwork) { ui.fWork = ui.fWork === fwork.dataset.fwork ? null : fwork.dataset.fwork; render(); return; }
    const fown = t.closest('[data-fown]');
    if (fown) { ui.fOwn = fown.dataset.fown; render(); return; }
    if (t.closest('[data-ffav]')) { ui.fFav = !ui.fFav; render(); return; }

    const bmode = t.closest('[data-bmode]');
    if (bmode) { ui.breedMode = bmode.dataset.bmode; renderBreeding(); return; }

    if (t.closest('[data-checkupdates]')) { runUpdateCheck(true); return; }
    if (t.closest('[data-ubclose]')) { const b = document.getElementById('update-banner'); if (b) b.style.display = 'none'; return; }

    const goto = t.closest('[data-goto]');
    if (goto) { ui.tab = goto.dataset.goto; render(); window.scrollTo(0, 0); return; }
    if (t.closest('[data-baseowned]')) { baseOwnedOnly = !baseOwnedOnly; renderBase(); return; }

    const cinc = t.closest('[data-cinc]');
    if (cinc) { const [id, d] = cinc.dataset.cinc.split(':'); store.setCounter(id, store.counter(id) + Number(d)); renderAccueil(); return; }

    const objChk = t.closest('[data-obj]');
    if (objChk && objChk.tagName === 'INPUT') { store.toggleObjective(objChk.dataset.obj); render(); return; }
    const objdel = t.closest('[data-objdel]');
    if (objdel) { store.removeObjective(objdel.dataset.objdel); renderObjectifs(); return; }
    const sugg = t.closest('[data-objsuggest]');
    if (sugg) { store.addObjective(sugg.dataset.objsuggest, 'Général'); renderObjectifs(); return; }
    if (t.id === 'obj-add-btn') {
      const inp = $('#obj-text'); const cat = $('#obj-cat');
      if (inp && inp.value.trim()) { store.addObjective(inp.value.trim(), cat ? cat.value : 'Général'); renderObjectifs(); }
      return;
    }
  });

  // Inputs délégués
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'search') { ui.search = t.value; refreshGridOnly(); return; }
    if (t.dataset.note != null) { store.setNote(t.dataset.note, t.value); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'bA' || t.id === 'bB') computeBreedResult();
    if (t.id === 'bTarget') computeBreedTarget();
    if (t.dataset.counter != null) { store.setCounter(t.dataset.counter, t.value); renderAccueil(); return; }
    const task = t.closest('[data-task]');
    if (task) { store.toggleTask(task.dataset.task); render(); }
  });

  // Entrée pour ajouter un objectif
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'obj-text' && e.target.value.trim()) {
      const cat = $('#obj-cat');
      store.addObjective(e.target.value.trim(), cat ? cat.value : 'Général');
      renderObjectifs();
    }
  });
}

// Rafraîchit uniquement la grille (garde le focus sur la recherche)
function refreshGridOnly() {
  const list = DB.pals.filter(matchesFilters);
  const grid = $('.grid'); const count = $('.count');
  if (grid) grid.innerHTML = list.map(palCard).join('') || '<div class="empty">Aucun Pal ne correspond aux filtres.</div>';
  if (count) count.textContent = `${list.length} résultat(s)`;
}

// ---------- Init ----------
(async function init() {
  await loadData();
  for (const p of DB.pals) {
    stats_.maxHp = Math.max(stats_.maxHp, p.stats.hp);
    stats_.maxAtk = Math.max(stats_.maxAtk, p.stats.atkMelee, p.stats.atkRanged);
    stats_.maxDef = Math.max(stats_.maxDef, p.stats.defense);
    stats_.maxRide = Math.max(stats_.maxRide, p.stats.rideSpeed);
  }
  bA = DB.pals[0].key; bB = DB.pals[1].key; bTarget = DB.pals[DB.pals.length - 1].key;
  wire();
  render();
  // Recherche de mise à jour au lancement (non bloquant)
  runUpdateCheck(false);
})();
