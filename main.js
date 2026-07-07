let paysSurvole = null;
let listePays = [];
const temperatures = {};

const TEXTES = {
  fr: {
    titrePage: 'Globe Météo 3D',
    placeholderRecherche: 'Rechercher un pays…',
    retourMonde: '← Retour au monde',
    recordsChaleur: 'Records de chaleur',
    analyse: (fait, total) => `Analyse : ${fait}/${total} pays`,
    chargement: 'Chargement…',
    zoneCliquee: 'Zone cliquée',
    ressenti: 'Ressenti :',
    humidite: 'Humidité :',
    vent: 'Vent :',
    meteoIndisponible: 'Météo indisponible'
  },
  en: {
    titrePage: '3D Weather Globe',
    placeholderRecherche: 'Search for a country…',
    retourMonde: '← Back to world',
    recordsChaleur: 'Heat records',
    analyse: (fait, total) => `Scanning: ${fait}/${total} countries`,
    chargement: 'Loading…',
    zoneCliquee: 'Clicked area',
    ressenti: 'Feels like:',
    humidite: 'Humidity:',
    vent: 'Wind:',
    meteoIndisponible: 'Weather unavailable'
  }
};

let langue = localStorage.getItem('langue') || 'fr';

function t(cle) {
  return TEXTES[langue][cle];
}

const monGlobe = Globe()
  .globeImageUrl(null)
  .backgroundColor('#000005')
  .showAtmosphere(true)
  .atmosphereColor('#a855f7')
  .atmosphereAltitude(0.18)
  .polygonCapColor(pays => pays === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
  .polygonSideColor(() => vueDetaillee ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.12)')
  .polygonStrokeColor(() => vueDetaillee ? 'rgba(192, 132, 252, 0.45)' : 'rgba(192, 132, 252, 0.7)')
  .polygonAltitude(pays => altitudePolygone(pays))
  .polygonsTransitionDuration(300)
  .polygonLabel(pays => `<b>${nomAffiche(pays)}</b>`)
  .onPolygonClick((zone, evenement, coords) => {
    afficherMeteo(zone, coords);
    if (!vueDetaillee) entrerDansPays(zone);
  })
  .onPolygonHover(pays => {
    paysSurvole = pays;
    rafraichirSurbrillance();
  });

monGlobe(document.getElementById('globe'));

const materiau = monGlobe.globeMaterial();
materiau.color.set('#0b0614');
materiau.emissive.set('#13082a');

monGlobe.controls().autoRotate = false;

window.addEventListener('resize', () => {
  monGlobe.width(window.innerWidth).height(window.innerHeight);
});

function rafraichirSurbrillance() {
  monGlobe
    .polygonCapColor(p => p === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
    .polygonSideColor(() => vueDetaillee ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.12)')
    .polygonStrokeColor(() => vueDetaillee ? 'rgba(192, 132, 252, 0.45)' : 'rgba(192, 132, 252, 0.7)')
    .polygonAltitude(p => altitudePolygone(p));
}

function altitudePolygone(zone) {
  if (zone === paysSurvole) return vueDetaillee ? 0.008 : 0.015;
  return vueDetaillee ? 0.002 : 0.006;
}

let traducteurPays = new Intl.DisplayNames([langue], { type: 'region' });

function traduireNomPays(pays) {
  const code = [pays.properties.ISO_A2, pays.properties.WB_A2]
    .find(c => typeof c === 'string' && /^[A-Z]{2}$/.test(c));
  if (!code) return null;
  try {
    const nom = traducteurPays.of(code);
    return nom === code ? null : nom;
  } catch {
    return null;
  }
}

function nomAffiche(zone) {
  return zone.properties.shapeName || zone.nomTraduit || zone.properties.ADMIN;
}

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(reponse => reponse.json())
  .then(donnees => {
    listePays = donnees.features;
    listePays.forEach(pays => pays.nomTraduit = traduireNomPays(pays));
    monGlobe.polygonsData(listePays);
    chargerTemperatures();
  });

const CLE_CACHE_TEMPERATURES = 'temperatures-pays';
const VALIDITE_CACHE = 30 * 60 * 1000;

function lireCacheTemperatures() {
  try {
    const brut = localStorage.getItem(CLE_CACHE_TEMPERATURES);
    if (!brut) return null;
    const { horodatage, valeurs } = JSON.parse(brut);
    if (Date.now() - horodatage > VALIDITE_CACHE) return null;
    return valeurs;
  } catch {
    return null;
  }
}

function sauvegarderCacheTemperatures() {
  localStorage.setItem(CLE_CACHE_TEMPERATURES, JSON.stringify({
    horodatage: Date.now(),
    valeurs: temperatures
  }));
}

const attente = duree => new Promise(resolve => setTimeout(resolve, duree));

function codePays(pays) {
  return pays.properties.ADM0_A3;
}

async function chargerTemperatures() {
  const enCache = lireCacheTemperatures();
  if (enCache) {
    Object.assign(temperatures, enCache);
    analyseTerminee = true;
    rafraichirTableau();
    return;
  }

  const TAILLE_LOT = 10;
  const PAUSE_ENTRE_LOTS = 12000;

  for (let debut = 0; debut < listePays.length; debut += TAILLE_LOT) {
    const lot = listePays.slice(debut, debut + TAILLE_LOT);
    await Promise.all(lot.map(async pays => {
      const centre = centreDuPays(pays);
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${centre.lat}&lon=${centre.lng}&units=metric&appid=${CONFIG.meteoApiKey}`;
      try {
        const reponse = await fetch(url);
        if (!reponse.ok) return;
        const meteo = await reponse.json();
        temperatures[codePays(pays)] = meteo.main.temp;
      } catch {}
    }));
    rafraichirTableau();
    if (debut + TAILLE_LOT < listePays.length) await attente(PAUSE_ENTRE_LOTS);
  }

  sauvegarderCacheTemperatures();
  analyseTerminee = true;
  rafraichirTableau();
}

const tableauChaleur = document.getElementById('tableau-chaleur');
const progressionChaleur = document.getElementById('progression-chaleur');
const listeChaleur = document.getElementById('liste-chaleur');
const TAILLE_CLASSEMENT = 8;
let analyseTerminee = false;

function rafraichirTableau() {
  const classement = listePays
    .filter(pays => temperatures[codePays(pays)] !== undefined)
    .sort((a, b) => temperatures[codePays(b)] - temperatures[codePays(a)])
    .slice(0, TAILLE_CLASSEMENT);

  if (classement.length === 0) return;

  tableauChaleur.classList.remove('cache');
  progressionChaleur.classList.toggle('cache', analyseTerminee);
  if (!analyseTerminee) {
    progressionChaleur.textContent = t('analyse')(Object.keys(temperatures).length, listePays.length);
  }

  listeChaleur.innerHTML = '';
  classement.forEach((pays, rang) => {
    const ligne = document.createElement('li');
    const bouton = document.createElement('button');
    const nom = document.createElement('span');
    nom.textContent = `${rang + 1}. ${nomAffiche(pays)}`;
    const valeur = document.createElement('span');
    valeur.className = 'temp-record';
    valeur.textContent = `${Math.round(temperatures[codePays(pays)])}°C`;
    bouton.append(nom, valeur);
    bouton.addEventListener('click', () => selectionnerPays(pays));
    ligne.appendChild(bouton);
    listeChaleur.appendChild(ligne);
  });
}

let vueDetaillee = false;
const cacheDetails = {};
const boutonRetour = document.getElementById('retour-monde');

function aireSignee(anneau) {
  let somme = 0;
  for (let i = 0; i < anneau.length - 1; i++) {
    somme += (anneau[i + 1][0] - anneau[i][0]) * (anneau[i + 1][1] + anneau[i][1]);
  }
  return somme;
}

function corrigerOrientation(zones) {
  zones.forEach(zone => {
    const geometrie = zone.geometry;
    const polygones = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates;
    polygones.forEach(anneaux => {
      anneaux.forEach((anneau, index) => {
        const estExterieur = index === 0;
        const estHoraire = aireSignee(anneau) > 0;
        if (estExterieur !== estHoraire) anneau.reverse();
      });
    });
  });
  return zones;
}

function entrerDansPays(pays) {
  const code = pays.properties.ADM0_A3;
  const centre = centreDuPays(pays);
  const altitude = Math.min(2.5, Math.max(0.4, centre.etendue / 35));

  const afficherZones = zones => {
    vueDetaillee = true;
    paysSurvole = null;
    rafraichirSurbrillance();
    monGlobe.polygonsData(zones);
    boutonRetour.classList.remove('cache');
    monGlobe.pointOfView({ lat: centre.lat, lng: centre.lng, altitude }, 1200);
  };

  if (cacheDetails[code]) {
    afficherZones(cacheDetails[code]);
    return;
  }

  const telechargement = fetch(`https://www.geoboundaries.org/api/current/gbOpen/${code}/ADM1/`)
    .then(reponse => {
      if (!reponse.ok) throw new Error(`pas de découpage pour ${code}`);
      return reponse.json();
    })
    .then(meta => fetch(meta.simplifiedGeometryGeoJSON.replace(
      'https://github.com/wmgeolab/geoBoundaries/raw/',
      'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/'
    )))
    .then(reponse => reponse.json());

  telechargement
    .then(donnees => {
      cacheDetails[code] = corrigerOrientation(donnees.features);
      afficherZones(cacheDetails[code]);
    })
    .catch(erreur => console.warn('Découpage indisponible :', erreur.message));
}

function revenirAuMonde() {
  vueDetaillee = false;
  paysSurvole = null;
  rafraichirSurbrillance();
  monGlobe.polygonsData(listePays);
  boutonRetour.classList.add('cache');
  monGlobe.pointOfView({ altitude: 2.5 }, 1200);
}

boutonRetour.addEventListener('click', revenirAuMonde);

document.addEventListener('keydown', evenement => {
  if (evenement.key === 'Escape' && vueDetaillee) revenirAuMonde();
});

const panneau = document.getElementById('panneau-meteo');

function afficherMeteo(pays, coords) {
  panneau.classList.remove('cache');
  panneau.innerHTML = `<h2>${nomAffiche(pays)}</h2><p>${t('chargement')}</p>`;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=${langue}&appid=${CONFIG.meteoApiKey}`;

  fetch(url)
    .then(reponse => {
      if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`);
      return reponse.json();
    })
    .then(meteo => {
      panneau.innerHTML = `
        <h2>${nomAffiche(pays)}</h2>
        <p class="lieu">${meteo.name || t('zoneCliquee')}</p>
        <div class="temperature">${Math.round(meteo.main.temp)}°C</div>
        <p class="description">
          <img src="https://openweathermap.org/img/wn/${meteo.weather[0].icon}@2x.png" alt="">
          ${meteo.weather[0].description}
        </p>
        <p>${t('ressenti')} ${Math.round(meteo.main.feels_like)}°C</p>
        <p>${t('humidite')} ${meteo.main.humidity}%</p>
        <p>${t('vent')} ${Math.round(meteo.wind.speed * 3.6)} km/h</p>
      `;
    })
    .catch(erreur => {
      panneau.innerHTML = `<h2>${nomAffiche(pays)}</h2><p>${t('meteoIndisponible')} (${erreur.message})</p>`;
    });
}

const champRecherche = document.getElementById('recherche');
const boiteSuggestions = document.getElementById('suggestions');

function normaliser(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function chercherPays(saisie) {
  const requete = normaliser(saisie);
  return listePays
    .filter(pays =>
      [pays.nomTraduit, pays.properties.ADMIN, pays.properties.NAME, pays.properties.NAME_LONG]
        .filter(Boolean)
        .some(nom => normaliser(nom).includes(requete))
    )
    .slice(0, 6);
}

function centreDuPays(pays) {
  const geometrie = pays.geometry;
  const polygones = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates;
  let meilleurContour = polygones[0][0];
  let meilleureSurface = 0;

  polygones.forEach(polygone => {
    const contour = polygone[0];
    const longitudes = contour.map(point => point[0]);
    const latitudes = contour.map(point => point[1]);
    const surface =
      (Math.max(...longitudes) - Math.min(...longitudes)) *
      (Math.max(...latitudes) - Math.min(...latitudes));
    if (surface > meilleureSurface) {
      meilleureSurface = surface;
      meilleurContour = contour;
    }
  });

  const longitudes = meilleurContour.map(point => point[0]);
  const latitudes = meilleurContour.map(point => point[1]);
  return {
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    etendue: Math.max(
      Math.max(...latitudes) - Math.min(...latitudes),
      Math.max(...longitudes) - Math.min(...longitudes)
    )
  };
}

function selectionnerPays(pays) {
  champRecherche.value = nomAffiche(pays);
  boiteSuggestions.innerHTML = '';
  if (vueDetaillee) revenirAuMonde();
  const centre = centreDuPays(pays);
  paysSurvole = pays;
  rafraichirSurbrillance();
  afficherMeteo(pays, centre);
  monGlobe.pointOfView({ lat: centre.lat, lng: centre.lng, altitude: 1.6 }, 1500);
  entrerDansPays(pays);
}

champRecherche.addEventListener('input', () => {
  boiteSuggestions.innerHTML = '';
  const saisie = champRecherche.value.trim();
  if (saisie.length < 2) return;

  chercherPays(saisie).forEach(pays => {
    const bouton = document.createElement('button');
    bouton.textContent = nomAffiche(pays);
    bouton.addEventListener('click', () => selectionnerPays(pays));
    boiteSuggestions.appendChild(bouton);
  });
});

champRecherche.addEventListener('keydown', evenement => {
  if (evenement.key === 'Enter') {
    const resultats = chercherPays(champRecherche.value.trim());
    if (resultats.length > 0) selectionnerPays(resultats[0]);
  }
  if (evenement.key === 'Escape') {
    boiteSuggestions.innerHTML = '';
    champRecherche.blur();
  }
});

const boutonLangueFr = document.getElementById('langue-fr');
const boutonLangueEn = document.getElementById('langue-en');

function appliquerLangue() {
  document.documentElement.lang = langue;
  document.title = t('titrePage');
  champRecherche.placeholder = t('placeholderRecherche');
  boutonRetour.textContent = t('retourMonde');
  document.getElementById('titre-chaleur').textContent = t('recordsChaleur');
  boutonLangueFr.classList.toggle('actif', langue === 'fr');
  boutonLangueEn.classList.toggle('actif', langue === 'en');
}

function changerLangue(nouvelleLangue) {
  if (nouvelleLangue === langue) return;
  langue = nouvelleLangue;
  localStorage.setItem('langue', langue);
  traducteurPays = new Intl.DisplayNames([langue], { type: 'region' });
  listePays.forEach(pays => pays.nomTraduit = traduireNomPays(pays));
  appliquerLangue();
  rafraichirTableau();
}

boutonLangueFr.addEventListener('click', () => changerLangue('fr'));
boutonLangueEn.addEventListener('click', () => changerLangue('en'));
appliquerLangue();
