let paysSurvole = null;

const monGlobe = Globe()
  .globeImageUrl(null)
  .backgroundColor('#000005')
  .showAtmosphere(true)
  .atmosphereColor('#a855f7')
  .atmosphereAltitude(0.18)
  .polygonCapColor(pays => pays === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
  .polygonSideColor(() => 'rgba(168, 85, 247, 0.25)')
  .polygonStrokeColor(() => '#c084fc')
  .polygonAltitude(pays => pays === paysSurvole ? 0.05 : 0.008)
  .polygonsTransitionDuration(300)
  .polygonLabel(pays => `<b>${pays.properties.ADMIN}</b>`)
  .onPolygonClick((pays, evenement, coords) => afficherMeteo(pays, coords))
  .onPolygonHover(pays => {
    paysSurvole = pays;
    monGlobe
      .polygonCapColor(p => p === paysSurvole ? 'rgba(240, 171, 252, 0.4)' : 'rgba(168, 85, 247, 0.15)')
      .polygonAltitude(p => p === paysSurvole ? 0.05 : 0.008);
  });

monGlobe(document.getElementById('globe'));

const materiau = monGlobe.globeMaterial();
materiau.color.set('#0b0614');
materiau.emissive.set('#13082a');

monGlobe.controls().autoRotate = false;

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(reponse => reponse.json())
  .then(donnees => {
    monGlobe.polygonsData(donnees.features);
  });

const panneau = document.getElementById('panneau-meteo');

function afficherMeteo(pays, coords) {
  panneau.classList.remove('cache');
  panneau.innerHTML = `<h2>${pays.properties.ADMIN}</h2><p>Chargement…</p>`;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=fr&appid=${CONFIG.meteoApiKey}`;

  fetch(url)
    .then(reponse => {
      if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`);
      return reponse.json();
    })
    .then(meteo => {
      panneau.innerHTML = `
        <h2>${pays.properties.ADMIN}</h2>
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
      panneau.innerHTML = `<h2>${pays.properties.ADMIN}</h2><p>Météo indisponible (${erreur.message})</p>`;
    });
}
