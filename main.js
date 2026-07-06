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
