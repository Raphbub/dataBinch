/* Contient les éléments relatifs à la carte */

// Initialisation de la carte selon la ville
const VUES = {
  TOUTES:   { centre: [45.499463, 5.780614], zoom: 4 },
  Lausanne: { centre: [46.522434, 6.632995], zoom: 14 },
  Lyon:     { centre: [45.760315, 4.837746], zoom: 12 },
  Avignon:  { centre: [43.948555, 4.809927], zoom: 14 },
  Riga:     { centre: [56.952365, 24.11503], zoom: 14 },
};

// Épingles en SVG (une goutte avec un pictogramme), sans bibliothèque d'icônes.
const GOUTTE = 'M15 1C7.3 1 1 7.3 1 15c0 9.8 14 26 14 26s14-16.2 14-26C29 7.3 22.7 1 15 1z';

// Chope de bière (blanc, sur fond bleu)
const PICTO_BAR = `
  <path d="M9 10.5h9v9.2a1.8 1.8 0 0 1-1.8 1.8h-5.4A1.8 1.8 0 0 1 9 19.7z" fill="#fff"/>
  <path d="M18 12.5h1.6a1.7 1.7 0 0 1 1.7 1.7v2.4a1.7 1.7 0 0 1-1.7 1.7H18" fill="none" stroke="#fff" stroke-width="1.6"/>
  <path d="M9.6 10.5c0-1.7 1.3-2.7 2.6-2.4.7-1 2.4-1 3 .1 1.5-.2 2.6.9 2.6 2.3z" fill="#fff"/>`;

// Usine à toit en dents de scie (gris foncé, sur fond clair)
const PICTO_BRASSERIE = `
  <path d="M8 21.5V14.5l4 2.5v-2.5l4 2.5V8.5h3.5v13z" fill="#37474f"/>
  <path d="M10 19h1.6v1.6H10zM13.5 19h1.6v1.6h-1.6zM17 19h1.6v1.6H17z" fill="#fff"/>`;

function creerIcone(fond, contour, picto, classe) {
  return new L.DivIcon({
    className: `marqueur ${classe}`,
    html: `<svg viewBox="0 0 30 42" width="30" height="42" aria-hidden="true">
             <path d="${GOUTTE}" fill="${fond}" stroke="${contour}" stroke-width="1.5"/>${picto}</svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 41],      // la pointe de la goutte repère le lieu
    tooltipAnchor: [14, -26],
  });
}

class ControleLocalisation extends L.Control {
  onAdd(map) {
    const conteneur = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const bouton = L.DomUtil.create('a', '', conteneur);
    bouton.href = '#';
    bouton.title = "Localisation de l'appareil";
    bouton.setAttribute('role', 'button');
    bouton.textContent = '◎';
    L.DomEvent.on(bouton, 'click', (e) => {
      L.DomEvent.stop(e);
      map.locate({ setView: true, maxZoom: 15 });
    });
    return conteneur;
  }
}

export function creerCarte(idConteneur, ville) {
  const vue = VUES[ville] ?? VUES.TOUTES;

  const osmLayer = new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });
  const topoLayer = new L.TileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'OpenTopoMap',
  });

  const carte = new L.LeafletMap(idConteneur, { center: vue.centre, zoom: vue.zoom });
  carte.addLayer(osmLayer);
  new L.Control.Layers({ 'Simple': osmLayer, 'Terrain': topoLayer }).addTo(carte);
  new L.Control.Scale({ imperial: false }).addTo(carte);
  new ControleLocalisation({ position: 'topleft' }).addTo(carte);

  let positionUtilisateur;
  carte.on('locationfound', (e) => {
    if (positionUtilisateur) carte.removeLayer(positionUtilisateur);
    positionUtilisateur = new L.CircleMarker(e.latlng, { radius: 8 }).addTo(carte);
  });
  carte.on('locationerror', () => {
    alert("Localisation impossible : vérifiez l'autorisation du navigateur.");
  });

  // Marqueurs : un dictionnaire nom -> marqueur par type
  const iconeBar = creerIcone('#37a9dd', '#2a85b0', PICTO_BAR, 'marqueur-bar');
  const iconeBrasserie = creerIcone('#ffffff', '#78909c', PICTO_BRASSERIE, 'marqueur-brasserie');
  const groupeBars = new L.FeatureGroup();
  const marqueurs = { bar: {}, brasserie: {} };

  function ajouter(type, lieux, champNom, icone, options, quandClique) {
    for (const lieu of lieux) {
      const nom = lieu[champNom];
      const marqueur = new L.Marker([lieu.Lat, lieu.Long], { riseOnHover: true, icon: icone })
        .bindTooltip(nom, options)
        .on('click', () => quandClique(nom))
        .addTo(carte);
      marqueurs[type][nom] = marqueur;
      if (type === 'bar') groupeBars.addLayer(marqueur);   // sert à cadrer « tous les bars »
    }
  }

  function aller(type, nom) {
    carte.eachLayer((l) => l.closeTooltip?.());
    const m = marqueurs[type][nom];
    if (!m) return;                       // nom inconnu : on ne plante pas
    carte.flyTo(m.getLatLng(), 15);
    m.openTooltip();
    m.setZIndexOffset(1000);
  }

  return {
    ajouterBars: (bars, quandClique) =>
      ajouter('bar', bars, 'Bar', iconeBar, { className: 'barTooltip' }, quandClique),
    ajouterBrasseries: (brasseries, quandClique) =>
      ajouter('brasserie', brasseries, 'Brasserie', iconeBrasserie, {}, quandClique),
    allerAuBar: (nom) => aller('bar', nom),
    allerALaBrasserie: (nom) => aller('brasserie', nom),
    toutVoir() {
      carte.eachLayer((l) => l.closeTooltip?.());
      const limites = groupeBars.getBounds();
      if (limites.isValid()) carte.flyToBounds(limites);
    }
  };
}