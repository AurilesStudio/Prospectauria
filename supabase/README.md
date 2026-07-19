# ☁️ Synchronisation cloud (Supabase)

Permet à plusieurs personnes (toi + ton beau-frère) d'utiliser l'app avec **chacun son
compte** et sa progression **synchronisée dans le cloud**, accessible depuis n'importe quel
appareil. Les données de chacun sont **privées** (Row Level Security).

L'app reste 100 % statique : le navigateur parle directement à Supabase. Sans configuration,
l'app fonctionne en local (localStorage) comme avant.

## Mise en place (~5 min, gratuit)

1. **Crée un projet** sur [supabase.com](https://supabase.com) (plan gratuit).
2. **Schéma** : ouvre *SQL Editor*, colle le contenu de [`schema.sql`](./schema.sql), exécute (*Run*).
3. **Auth email** : *Authentication → Sign In / Providers → Email* → activé.
   - *Authentication → Providers → Email* → **désactive « Confirm email »** (connexion immédiate).
4. **App privée — n'autoriser QUE les personnes choisies** :
   - *Authentication → Sign In / Providers* (ou *Settings*) → **désactive « Allow new users to sign up »**.
     → Plus personne ne peut créer de compte tout seul, même avec le lien.
   - Crée toi-même les comptes autorisés : *Authentication → Users → Add user* →
     saisis l'email + un mot de passe (coche « Auto Confirm User »). Répète pour ton beau-frère
     (ou toute personne que tu choisis). Tu peux en ajouter/supprimer à tout moment.
5. **Clés** : *Project Settings → API* → copie **Project URL** et la clé **anon public**.
   > La clé `anon` est faite pour être publique : la sécurité vient des règles RLS (étape 2)
   > et de l'inscription désactivée (étape 4).
6. **Branche l'app**, au choix :
   - **Déploiement partagé** (recommandé) : colle URL + clé anon dans
     [`js/config.js`](../js/config.js), commit, déploie (GitHub Pages…), partage l'URL.
     Ton beau-frère se connecte avec le compte que tu lui as créé (étape 4).
   - **Test rapide** : dans l'app → **⚙️ Compte → Configurer**, colle URL + clé
     (mémorisées dans ton navigateur).

## Accès privé (résumé)

Une fois configurée, l'app est **verrouillée derrière la connexion** (`AUTH.requireLogin`
dans `js/config.js`) : un visiteur sans compte voit un écran de connexion et rien d'autre.
Comme l'auto-inscription est désactivée côté Supabase **et** dans l'app (`AUTH.allowSignup:false`),
**seuls les comptes que tu crées** peuvent se connecter. Pour donner accès à quelqu'un :
*Authentication → Users → Add user*. Pour retirer l'accès : supprime son utilisateur.

## Utilisation

- Ouvre l'app → écran de connexion → email + mot de passe (fournis par toi).
- Une fois connecté, chaque changement est sauvegardé dans le cloud (indicateur de synchro),
  et retrouvé sur tous tes appareils.

## Option : Supabase en local, via Docker (sans projet cloud)

Si tu ne peux pas créer de projet sur supabase.com, tu peux faire tourner **toute la stack
Supabase sur ta machine** avec Docker + la CLI Supabase. L'app se branche dessus à l'identique.

> Pré-requis : **Docker Desktop** lancé, et la **CLI Supabase**
> (`npm install -g supabase`, ou `brew install supabase/tap/supabase`).

```bash
# À la racine du dépôt
supabase init      # crée supabase/config.toml (garde les migrations déjà présentes)
supabase start     # démarre la stack Docker (Postgres, Auth, API, Studio…)
                   # → applique automatiquement supabase/migrations/*.sql (la table progress)
```

`supabase start` affiche à la fin :

```
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGciOi...   <-- copie cette clé
```

**Brancher l'app** — dans l'app → **⚙️ Compte → Configurer** :
- URL : `http://127.0.0.1:54321`
- Clé anon : celle affichée ci-dessus

**Créer ton compte** (deux options) :
- **Le plus simple en solo** : dans [`js/config.js`](../js/config.js), mets
  `allowSignup: true`, puis dans l'app crée ton compte (email + mot de passe au choix).
- Ou via *Studio* (`http://127.0.0.1:54323`) → *Authentication → Add user*.

**Au quotidien** : lance `supabase start` avant d'ouvrir l'app (puis `supabase stop` pour
tout arrêter). Les données vivent dans le volume Docker de Postgres.
`supabase db reset` réapplique les migrations à neuf.

> ⚠️ Instance **locale uniquement** : accessible depuis ta machine (et ton téléphone sur le
> même réseau via l'IP locale de ton PC, ex. `http://192.168.1.20:54321`). Rien n'est exposé
> sur Internet. Pour un usage **solo**, `localStorage` seul (sans rien installer) fait déjà
> le travail — Supabase local n'apporte qu'une vraie base SQL + sauvegardes structurées.

## Données stockées

Table `progress` : `user_id`, `state` (JSON : Pals obtenus, favoris, notes, tâches,
compteurs, objectifs), `updated_at`. Aucune donnée personnelle hors email de compte.
