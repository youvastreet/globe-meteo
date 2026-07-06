let paysSurvole = null;

const monGlobe = Globe()
  .globeImageUrl(null)
  .backgroundColor('#000005')
  .showAtmosphere(true)
  .atmosphereColor('#a855f7')
  .atmosphereAltitude(0.18)
  .hexPolygonResolution(3)
  .hexPolygonMargin(0.4)
  .hexPolygonColor(pays => pays === paysSurvole ? '#f0abfc' : '#a855f7')
  .hexPolygonAltitude(pays => pays === paysSurvole ? 0.05 : 0.001)
  .hexPolygonsTransitionDuration(300)
  .hexPolygonLabel(pays => `<b>${pays.properties.ADMIN}</b>`)
  .onHexPolygonHover(pays => {
    paysSurvole = pays;
    monGlobe
      .hexPolygonColor(p => p === paysSurvole ? '#f0abfc' : '#a855f7')
      .hexPolygonAltitude(p => p === paysSurvole ? 0.05 : 0.001);
  });

monGlobe(document.getElementById('globe'));

const materiau = monGlobe.globeMaterial();
materiau.color.set('#0b0614');
materiau.emissive.set('#13082a');

monGlobe.controls().autoRotate = false;

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(reponse => reponse.json())
  .then(donnees => {
    monGlobe.hexPolygonsData(donnees.features);
  });
