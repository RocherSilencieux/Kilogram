# Kilogram 📸🎨

Kilogram est un réseau social de croquis et de partages visuels, composé d'un frontend React + Vite + TypeScript et d'un backend Node.js + Express + Prisma (SQLite/PostgreSQL).

---

## 🚀 Démarrage rapide

### 1. Installation des dépendances

À la racine du projet, installez les dépendances du frontend et du backend :

```bash
# Dans le dossier backend
cd backend
npm install

# Dans le dossier frontend (dans un autre terminal ou séparément)
cd ../frontend
npm install
```

---

### 2. Configuration & Initialisation du Backend

Configurez le fichier d'environnement et initialisez la base de données :

```bash
cd backend

# Créer le fichier .env (si non existant)
cp .env.example .env

# Exécuter les migrations Prisma et insérer les données de démonstration (seeding)
npx prisma migrate dev --name init
npm run seed
```

---

### 3. Lancement des serveurs de développement

Ouvrez deux terminaux distincts :

#### Terminal 1 : Backend (Port 3000)
```bash
cd backend
npm run dev
```
> Le serveur tourne sur `http://localhost:3000`

#### Terminal 2 : Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
> L'application frontend est accessible sur `http://localhost:5173`

*Alternative depuis la racine du projet :*
```bash
npm run dev:backend   # Lance le backend
npm run dev:frontend  # Lance le frontend
```

---

## 🔑 Comptes de démonstration / Test

| Email | Mot de passe | Rôle |
| :--- | :--- | :--- |
| `alice@test.com` | `password123` | Utilisateur |
| `bob@test.com` | `password123` | Utilisateur |
| `admin@test.com` | `password123` | Administrateur |

---

## 🛠 Tech Stack

- **Frontend** : React 18, TypeScript, Vite, CSS Vanilla.
- **Backend** : Node.js, Express, TypeScript, Prisma ORM, SQLite.
