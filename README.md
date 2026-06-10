# VinnHT

**Le marché numérique d’Haïti**

Marketplace multi-rôles construite avec Express, MySQL et React.

## Démarrage local

### Installation
```powershell
npm --prefix backend install
npm --prefix frontend install
```

### MySQL
Copier `backend/.env.example` vers `backend/.env`, puis adapter les paramètres MySQL.

Si MySQL refuse `root` sans mot de passe, renseigner :

```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
```

### Commandes depuis la racine
```powershell
npm run db:migrate
npm run dev:backend
npm run dev:frontend
```

L’API est disponible sur `http://localhost:5056/api`.
