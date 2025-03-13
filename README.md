# Lord Of The Coin

Un jeu multijoueur de plateforme où les joueurs s'affrontent pour l'anneau.

## Prérequis

- Node.js (v14 ou supérieur)
- NPM ou Yarn
- Docker et Docker Compose

## Installation

1. Clonez le dépôt :
```
git clone <url-du-repo>
cd lord_of_the_coin
```

2. Installez les dépendances du serveur :
```
cd server
npm install
```

3. Installez les dépendances du client :
```
cd ../client
npm install
```

## Configuration de la base de données

1. Lancez la base de données MySQL avec Docker Compose (depuis la racine du projet) :
```
docker-compose up -d
```
Cette commande va démarrer:
- Un serveur MySQL sur le port 3307
- Une interface PHPMyAdmin accessible sur http://localhost:8080

2. Vérifiez que les conteneurs sont bien en cours d'exécution :
```
docker-compose ps
```

3. Migrations de la base de données (depuis le dossier `server`) :
```
cd server
npx sequelize-cli db:migrate
```

## Lancement de l'application

1. Démarrez le serveur (depuis le dossier `server`) :
```
npm start
```
Le serveur démarrera sur le port 5000 par défaut.

2. Dans un autre terminal, démarrez le client (depuis le dossier `client`) :
```
npm start
```
L'application client démarrera sur le port 3000 par défaut.

3. Ouvrez votre navigateur et accédez à `http://localhost:3000`

