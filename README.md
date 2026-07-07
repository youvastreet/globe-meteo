# 🌍 Globe Météo 3D

> 🇬🇧 [English version](README.en.md)

Globe terrestre 3D interactif au style néon : cliquez sur un pays pour voir sa météo en temps réel, explorez ses régions, et suivez le classement mondial des records de chaleur en direct.

**[▶️ Essayer la démo en ligne](https://youvastreet.github.io/globe-meteo/)**

[![Aperçu du globe](docs/apercu.png)](https://youvastreet.github.io/globe-meteo/)

> La démo en ligne tourne sans clé API : la météo en direct y est désactivée. Pour l'expérience complète, voir la section « Lancer le projet ».

## Fonctionnalités

- **Globe 3D néon** — pays en polygones translucides violets, halo atmosphérique, surbrillance animée au survol
- **Météo en temps réel** — clic sur un pays : température, ressenti, humidité, vent et description (OpenWeatherMap)
- **Drill-down mondial** — clic sur n'importe quel pays pour zoomer sur ses régions administratives (geoBoundaries ADM1)
- **Records de chaleur** — classement en direct des 8 pays les plus chauds, chaque ligne vole vers le pays au clic
- **Recherche de pays** — suggestions instantanées, accents ignorés, fonctionne en français comme en anglais
- **Interface bilingue FR/EN** — bascule à chaud, noms de pays retraduits via `Intl.DisplayNames`, choix mémorisé
- **Zéro build** — HTML/CSS/JS vanilla, une seule bibliothèque externe chargée par CDN

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| [globe.gl](https://globe.gl) (Three.js) | Rendu 3D du globe et des polygones |
| [OpenWeatherMap](https://openweathermap.org/api) | Météo en temps réel |
| [Natural Earth](https://www.naturalearthdata.com/) (GeoJSON) | Frontières des pays |
| [geoBoundaries](https://www.geoboundaries.org/) | Découpages régionaux de tous les pays |
| `Intl.DisplayNames` | Traduction des noms de pays sans dictionnaire |
| `localStorage` | Cache météo (30 min) et préférence de langue |

## 🧗 Défis techniques résolus

### Polygones régionaux inversés
Les GeoJSON de geoBoundaries enroulent leurs anneaux dans le sens inverse de celui attendu par globe.gl : au lieu de la région, c'était *toute la Terre sauf la région* qui s'affichait. Diagnostic mené jusqu'à la convention d'orientation des polygones sphériques, puis correction par calcul de l'**aire signée** de chaque anneau (`corrigerOrientation()` dans [main.js](main.js)).

### Z-fighting entre les pays et la sphère
À très basse altitude, le maillage de la sphère « perce » à travers les polygones des pays : taches sombres scintillantes qui bougent avec la caméra. La précision du tampon de profondeur dépendant de la distance, le réglage est différencié : altitude 0.006 en vue monde, 0.002 en vue détaillée où la caméra proche rend le conflit inoffensif.

### Limite de l'API météo
Le classement des records de chaleur interroge la météo de ~180 pays, mais le plan gratuit d'OpenWeatherMap plafonne à 60 appels/minute. Solution : chargement par **lots de 10 requêtes toutes les 12 secondes** avec mise à jour progressive du classement, et cache `localStorage` de 30 minutes pour rendre les rechargements instantanés.

## 🚀 Lancer le projet

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/youvastreet/globe-meteo.git
   cd globe-meteo
   ```
2. Créer une clé API gratuite sur [openweathermap.org](https://openweathermap.org/api), puis créer un fichier `config.js` à la racine :
   ```js
   const CONFIG = {
     meteoApiKey: 'VOTRE_CLE_API'
   };
   ```
3. Ouvrir `index.html` dans un navigateur — c'est tout, aucune installation.

> ⚠️ `config.js` est volontairement exclu du dépôt (`.gitignore`) pour ne pas exposer la clé API.

## 🗺️ Pistes d'amélioration

- Démo en ligne avec un proxy serverless pour masquer la clé API côté serveur
- Prévisions sur 5 jours avec graphique de température
- Terminateur jour/nuit en temps réel
- Drill-down au niveau ADM2 (départements, comtés…)
