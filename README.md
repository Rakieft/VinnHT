# VinnHT

**Le marché numérique d’Haïti**

Marketplace multi-rôles construite avec Express, MySQL et React.

## Démarrage local

```powershell
npm --prefix backend install
npm --prefix frontend install
npm run db:migrate
npm run dev:backend
npm run dev:frontend
```

L’API locale utilise `http://localhost:5056/api` et le frontend `http://localhost:3000`.

## Vérifications

```powershell
npm run check
npm run db:migrate
```

`npm run check` vérifie la syntaxe backend, exécute les tests de sécurité et compile le frontend.

## Authentification

- Le JWT est conservé dans un cookie `HttpOnly`.
- En production, le cookie est `Secure` et `SameSite=Strict`.
- Les comptes suspendus perdent immédiatement leur accès.
- Les tentatives de connexion et les appels API sont limités.

Le renouvellement du secret `JWT_SECRET` déconnecte toutes les sessions existantes.

## Images

Le développement local utilise `backend/uploads`.

Pour Cloudinary en production :

```env
IMAGE_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Sans ces valeurs, VinnHT utilise automatiquement le stockage local.

## Sauvegardes MySQL

Créer une sauvegarde complète :

```powershell
npm run db:backup
```

Restaurer une sauvegarde :

```powershell
npm run db:restore -- backend/backups/vinnht-date.json
```

Les sauvegardes sont ignorées par Git. Configurez une tâche planifiée quotidienne exécutant
`npm run db:backup`. La rétention est contrôlée par `BACKUP_RETENTION_DAYS`.

## HTTPS

La méthode recommandée en production est un reverse proxy HTTPS comme Nginx, Caddy ou le proxy
de l’hébergeur, avec `TRUST_PROXY=true`.

Node peut aussi servir HTTPS directement :

```env
SSL_KEY_PATH=C:\certificates\vinnht-key.pem
SSL_CERT_PATH=C:\certificates\vinnht-cert.pem
```

Les deux chemins doivent être renseignés.

## Déploiement production

1. Utiliser `backend/.env.production.example` et `frontend/.env.production.example`.
2. Créer un utilisateur MySQL dédié à VinnHT, sans utiliser `root`.
3. Configurer HTTPS et Cloudinary.
4. Exécuter `npm run db:migrate`.
5. Exécuter `npm run check`.
6. Compiler avec `npm run build`.
7. Planifier `npm run db:backup`.
8. Ne jamais versionner `.env`, les certificats ou les sauvegardes.
