# 🌍 3D Weather Globe

> 🇫🇷 [Version française](README.md)

Interactive neon-styled 3D globe: click any country to see its live weather, explore its regions, and watch the world heat-records leaderboard update in real time.

**[▶️ Try the live demo](https://youvastreet.github.io/globe-meteo/)**

[![Globe preview](docs/apercu.png)](https://youvastreet.github.io/globe-meteo/)

> The live demo runs without an API key: real-time weather is disabled there. For the full experience, see the "Run the project" section.

## ✨ Features

- **Neon 3D globe** — countries as translucent purple polygons, atmospheric glow, animated hover highlight
- **Live weather** — click a country: temperature, feels-like, humidity, wind and description (OpenWeatherMap)
- **Worldwide drill-down** — click any country to zoom into its administrative regions (geoBoundaries ADM1)
- **Heat records** — live leaderboard of the 8 hottest countries; each row flies to its country on click
- **Country search** — instant suggestions, accent-insensitive, works in both French and English
- **Bilingual FR/EN interface** — hot toggle, country names retranslated via `Intl.DisplayNames`, choice persisted
- **Zero build step** — vanilla HTML/CSS/JS, a single external library loaded from a CDN

## 🛠️ Tech stack

| Tool | Purpose |
|---|---|
| [globe.gl](https://globe.gl) (Three.js) | 3D rendering of the globe and polygons |
| [OpenWeatherMap](https://openweathermap.org/api) | Live weather data |
| [Natural Earth](https://www.naturalearthdata.com/) (GeoJSON) | Country borders |
| [geoBoundaries](https://www.geoboundaries.org/) | Regional subdivisions for every country |
| `Intl.DisplayNames` | Country name translation without a dictionary |
| `localStorage` | Weather cache (30 min) and language preference |

## 🧗 Technical challenges solved

### Inverted region polygons
geoBoundaries GeoJSON files wind their rings in the opposite direction from what globe.gl expects: instead of the region, *the whole Earth except the region* was rendered. Diagnosed down to the spherical polygon orientation convention, then fixed by computing the **signed area** of each ring (`corrigerOrientation()` in [main.js](main.js)).

### Z-fighting between countries and the sphere
At very low altitude, the sphere mesh "pokes" through the country polygons: dark flickering patches that move with the camera. Since depth-buffer precision depends on camera distance, the setting is view-dependent: altitude 0.006 in world view, 0.002 in detail view where the close camera makes the conflict harmless.

### Weather API rate limit
The heat-records leaderboard queries weather for ~180 countries, but OpenWeatherMap's free plan caps at 60 calls/minute. Solution: **batches of 10 requests every 12 seconds** with progressive leaderboard updates, plus a 30-minute `localStorage` cache making reloads instant.

## 🚀 Run the project

1. Clone the repository:
   ```bash
   git clone https://github.com/youvastreet/globe-meteo.git
   cd globe-meteo
   ```
2. Create a free API key on [openweathermap.org](https://openweathermap.org/api), then create a `config.js` file at the root:
   ```js
   const CONFIG = {
     meteoApiKey: 'YOUR_API_KEY'
   };
   ```
3. Open `index.html` in a browser — that's it, nothing to install.

> ⚠️ `config.js` is deliberately excluded from the repository (`.gitignore`) to keep the API key private.

## 🗺️ Roadmap

- Online demo with a serverless proxy to hide the API key server-side
- 5-day forecast with a temperature chart
- Real-time day/night terminator
- ADM2-level drill-down (departments, counties…)
