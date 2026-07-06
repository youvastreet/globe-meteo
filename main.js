let paysSurvole = null;
let listePays = [];

const monGlobe = Globe()
  .globeImageUrl(null)
  .backgroundColor('#000005')
  .showAtmosphere(true)
  .atmosphereColor('#a855f7')
  .atmosphereAltitude(0.18)
  .polygonCapColor(pays => pays === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
  .polygonSideColor(() => 'rgba(168, 85, 247, 0.12)')
  .polygonStrokeColor(() => 'rgba(192, 132, 252, 0.7)')
  .polygonAltitude(pays => pays === paysSurvole ? 0.05 : 0.002)
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

function rafraichirSurbrillance() {
  monGlobe
    .polygonCapColor(p => p === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
    .polygonAltitude(p => p === paysSurvole ? 0.05 : 0.002);
}

const traducteurPays = new Intl.DisplayNames(['fr'], { type: 'region' });

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
  return zone.properties.nom || zone.properties.shapeName || zone.nomFrancais || zone.properties.ADMIN;
}

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(reponse => reponse.json())
  .then(donnees => {
    listePays = donnees.features;
    listePays.forEach(pays => pays.nomFrancais = traduireNomPays(pays));
    monGlobe.polygonsData(listePays);
  });

const CARTES_DETAILLEES = {
  FRA: 'https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/departements-version-simplifiee.geojson'
};

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

  const telechargement = CARTES_DETAILLEES[code]
    ? fetch(CARTES_DETAILLEES[code]).then(reponse => reponse.json())
    : fetch(`https://www.geoboundaries.org/api/current/gbOpen/${code}/ADM1/`)
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
  panneau.innerHTML = `<h2>${nomAffiche(pays)}</h2><p>Chargement…</p>`;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=fr&appid=${CONFIG.meteoApiKey}`;

  fetch(url)
    .then(reponse => {
      if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`);
      return reponse.json();
    })
    .then(meteo => {
      panneau.innerHTML = `
        <h2>${nomAffiche(pays)}</h2>
        <p class="lieu">${meteo.name || 'Zone cliquée'}</p>
        <div class="temperature">${Math.round(meteo.main.temp)}°C</div>
        <p class="description">
          <img src="https://openweathermap.org/img/wn/${meteo.weather[0].icon}@2x.png" alt="">
          ${meteo.weather[0].description}
        </p>
        <p>Ressenti : ${Math.round(meteo.main.feels_like)}°C</p>
        <p>Humidité : ${meteo.main.humidity}%</p>
        <p>Vent : ${Math.round(meteo.wind.speed * 3.6)} km/h</p>
      `;
    })
    .catch(erreur => {
      panneau.innerHTML = `<h2>${nomAffiche(pays)}</h2><p>Météo indisponible (${erreur.message})</p>`;
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
      [pays.nomFrancais, pays.properties.ADMIN, pays.properties.NAME, pays.properties.NAME_LONG]
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
