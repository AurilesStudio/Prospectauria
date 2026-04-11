# Auri-Prospects 🛠️

Auri-Prospects est un outil d’acquisition automatisé conçu pour extraire des prospects qualifiés depuis Google Maps (focus 92) et les gérer via un mini-CRM intégré.

## Fonctionnalités
- **Scraper Google Maps** : Extraction ciblée (92).
- **Mini-CRM** : Gestion du pipeline de prospection.
- **Supabase Integration** : Persistence des données.
- **Fork-and-Run** : Installation rapide via Docker ou scripts locaux.

## Stack
- **Frontend** : React (Vite) + Tailwind CSS
- **Backend** : Node.js (Express)
- **Database** : Supabase
- **Scraping** : Puppeteer

## Installation (Local)

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-compte/auri-prospects.git
   cd auri-prospects
   ```

2. **Configuration** :
   Créez un fichier `.env` à la racine avec vos accès Supabase.
   ```env
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   ```

3. **Lancer le projet** :
   ```bash
   docker-compose up --build
   ```
   Ou manuellement :
   ```bash
   # Terminal 1: Server
   cd server && npm install && npm start
   # Terminal 2: Client
   cd client && npm install && npm run dev
   ```

## Structure
- `/client` : Frontend React.
- `/server` : Backend Express & API CRM.
- `/scraper` : Scripts de scraping Google Maps.
- `/docker-compose.yml` : Configuration Docker.

---
*Propulsé par AURIA-OS | CTO: Goku*
