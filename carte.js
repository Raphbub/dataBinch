/* Contient les éléments relatifs à la carte */

// Initialisation de la carte selon la ville
const VUES = {
  TOUTES:   { centre: [45.499463, 5.780614], zoom: 4 },
  Lausanne: { centre: [46.522434, 6.632995], zoom: 14 },
  Lyon:     { centre: [45.760315, 4.837746], zoom: 12 },
  Avignon:  { centre: [43.948555, 4.809927], zoom: 14 },
  Riga:     { centre: [56.952365, 24.11503], zoom: 14 },
};

function creerIcone(emoji, classe) {
  return new L.DivIcon({
    className: `marqueur ${classe}`,
    html: `<span>${emoji}</span>`,
    iconSize: [30, 30], iconAnchor: [15, 15], tooltipAnchor: [16, 0],
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
  const iconeBar = creerIcone('🍺', 'marqueur-bar');
  const iconeBrasserie = creerIcone('🏭', 'marqueur-brasserie');
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