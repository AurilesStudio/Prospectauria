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
   - Recommandé pour 2 joueurs : *Authentication → Providers → Email* → **désactive « Confirm email »**
     (inscription immédiate, sans email de confirmation).
4. **Clés** : *Project Settings → API* → copie **Project URL** et la clé **anon public**.
   > La clé `anon` est faite pour être publique : la sécurité vient des règles RLS (étape 2).
5. **Branche l'app**, au choix :
   - **Déploiement partagé** (recommandé) : colle URL + clé anon dans
     [`js/config.js`](../js/config.js), commit, déploie (GitHub Pages…), partage l'URL.
     Ton beau-frère n'aura plus qu'à créer son compte.
   - **Test rapide** : dans l'app → **⚙️ Compte → Configurer**, colle URL + clé
     (mémorisées dans ton navigateur).

## Utilisation

- **⚙️ Compte** dans la barre du haut → *Créer un compte* / *Se connecter*.
- Une fois connecté, chaque changement est sauvegardé dans le cloud (indicateur de synchro).
- À la première connexion, ta progression locale existante est **envoyée** dans le cloud
  (rien n'est perdu). Sur un autre appareil, connecte-toi et tout est retrouvé.

## Données stockées

Table `progress` : `user_id`, `state` (JSON : Pals obtenus, favoris, notes, tâches,
compteurs, objectifs), `updated_at`. Aucune donnée personnelle hors email de compte.
