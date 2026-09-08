# Backend

```
cp .env.example .env
npm install && npx prisma migrate dev --name init && npm run seed
npm run dev
```

Serveur sur `http://localhost:3000`. Comptes de test : `alice@test.com` / `bob@test.com` / `admin@test.com`, mot de passe `password123`.
