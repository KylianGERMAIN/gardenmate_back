# GardenMate – Backend API

Backend API développé en Node.js, Express et TypeScript, utilisant Prisma comme ORM.

---

## Stack technique

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Tests : Jest
- Qualité : ESLint, Prettier, Husky, lint-staged
- Containerisation : Docker & Docker Compose

---

## Structure du projet

```
src/
├── routes/        # Routes Express
├── service/       # Logique métier
├── middleware/    # Middlewares (auth, permissions…)
├── errors/        # Erreurs personnalisées
├── prisma/        # Client Prisma
└── index.ts       # Point d’entrée
```

---

## Installation

### Prérequis

- Node.js ≥ 18
- npm
- PostgreSQL

### Installer les dépendances

```
npm install
```

### Configuration des variables d’environnement

Créer un fichier `.env` à la racine :

```
DATABASE_URL="postgresql://user:password@localhost:5432/gardenmate"
JWT_SECRET="change-me"
```

---

## Docker

### Lancer les conteneurs

```
docker-compose up --build
```

### Accès à la base PostgreSQL

- Hôte : localhost
- Port : 5433
- User : garden
- Password : secret
- DB : gardenmate

---

## Prisma

### Générer le client Prisma

```
npx prisma generate
```

### Appliquer les migrations

```
npx prisma migrate dev
```

### (Optionnel) Seed de la base

```
npm run prisma:seed
```

---

## Lancer l’application

```
npm run dev
```

---

## Tests

### Lancer les tests

```
npm run test
```

### Mode watch

```
npm run test:watch
```

---

## Qualité de code

- ESLint + Prettier
- Hooks Git via Husky
- Vérification automatique avant commit avec lint-staged
