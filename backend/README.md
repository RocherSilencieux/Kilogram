# Kilogram Backend ⚙️

Serveur Express + TypeScript + Prisma.

## 🚀 Démarrage

```bash
# 1. Configuration de l'environnement
cp .env.example .env

# 2. Installation des dépendances, migration DB et seed
npm install
npx prisma migrate dev --name init
npm run seed

# 3. Lancer le serveur de développement (watch mode)
npm run dev
```

Le serveur tourne sur `http://localhost:3000`.

## 🔑 Comptes de test

- `alice@test.com` / `password123`
- `bob@test.com` / `password123`
- `admin@test.com` / `password123`

