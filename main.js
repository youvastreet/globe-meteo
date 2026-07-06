// ÉTAPE 1 : afficher un globe 3D qui tourne tout seul
// La fonction Globe() vient de la librairie globe.gl chargée dans index.html

// On configure le globe en chaînant les méthodes : chaque méthode
// règle une option et renvoie le globe, ce qui permet d'enchaîner.
const monGlobe = Globe()
  // La texture "photo" de la Terre (image satellite de la NASA)
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  // Le relief : cette image dit à la 3D où sont les montagnes
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  // Le fond étoilé derrière le globe
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png');

// On "monte" le globe dans la div #globe de notre page HTML.
// C'est ici que globe.gl crée la scène Three.js (caméra, lumières, sphère...)
monGlobe(document.getElementById('globe'));

// controls() donne accès aux contrôles de la caméra (les mêmes
// OrbitControls que dans ton projet de particules Three.js)
monGlobe.controls().autoRotate = true;      // rotation automatique
monGlobe.controls().autoRotateSpeed = 0.5;  // vitesse douce (défaut : 2.0)
