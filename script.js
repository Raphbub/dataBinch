//////////////////////
// DÉMARRAGE : CHARGEMENT DES DONNÉES ET CHOIX DE LA VILLE

// fetch ne signale pas les erreurs HTTP (404...) : on le fait ici
function chargerJSON(url) {
  return fetch(url).then(function(reponse) {
    if (!reponse.ok) throw new Error(`${url} : erreur ${reponse.status}`);
    return reponse.json();
  });
}

// Ligne du CSV de distances, conversion du poids en nombre
function ligneDistance(d) {
  return { Ville: d.Ville, Source: d.Source, Target: d.Target, weight: +d.Weight };
}

function afficherErreur(e) {
  console.error(e);
  const bandeau = document.createElement('div');
  bandeau.className = 'alert alert-danger';
  bandeau.setAttribute('role', 'alert');
  bandeau.textContent = `Impossible de charger les données (${e.message}). Rechargez la page.`;
  document.body.prepend(bandeau);
}

function creerTomSelect(select, placeholder, options = {}) {
  return new TomSelect(select, {
    placeholder,
    maxOptions: null,   // 50 par défaut : on veut toute la liste
    render: { no_results: () => '<div class="no-results">Aucun résultat</div>' },
    ...options
  });
}

function creerSelecteur(conteneurId, id, placeholder, toutes, valeurs, onChange) {
  const select = document.createElement('select');
  select.id = id;
  select.add(new Option('', '')); // option vide placeholder
  for (const v of [toutes, ...valeurs]) select.add(new Option(String(v), String(v)));
  select.addEventListener('change', onChange);
  document.getElementById(conteneurId).append(select);
  return creerTomSelect(select, placeholder);
}

async function demarrer() {
  // Les trois téléchargements démarrent tout de suite, en parallèle
  const pBars = chargerJSON("data/bars.json");
  const pBinches = chargerJSON("data/binches.json");
  const pDistances = d3.csv("data/rowdist.csv", ligneDistance);

  // Attendre les bars (petit json) pour définir les villes
  const bars = await pBars;
  const villes = [...new Set(bars.map(item => item.Ville).sort())];

  // Sélecteur de villes (accueil)
  const selectVille = document.createElement('select');
  selectVille.id = 'city-list';
  selectVille.add(new Option('', ''));   // option vide placeholder
  // Assignement des villes au sélecteur
  for (const v of ["TOUTES", ...villes]) selectVille.add(new Option(v, v));
  document.getElementById('filtercity').append(selectVille);
  const tomVille = creerTomSelect(selectVille, 'Une ville précise?');

  const dialogue = document.getElementById('choix-ville');
  let lance = false;
  async function lancer() {
    if (lance) return; // Valider et fermeture passent ici
    lance = true;
    const ville = tomVille.getValue() || 'TOUTES';
    if (dialogue.open) dialogue.close();
    try {
      const [binches, distances] = await Promise.all([pBinches, pDistances]);
      binchesVilleSelected(ville, bars, binches, distances);
    } catch (e) {
      afficherErreur(e);
    }
  }
  document.getElementById('valider').addEventListener('click', lancer);
  dialogue.addEventListener('close', lancer);   // Échap = « TOUTES »
  dialogue.showModal();
}

demarrer().catch(afficherErreur);

binchesVilleSelected = function(villechoisie, bars, binches, distances) {

  if (villechoisie == 'TOUTES') {
    window.barsVilleChoisie = bars;
    console.log(barsVilleChoisie);
    window.binchesVilleChoisie = binches;
    console.log(binchesVilleChoisie);
    window.binchesVilleChoisieavecCOO = bars;

  } else {
    window.barsVilleChoisie = bars.filter(f => villechoisie.includes(f.Ville)).map(f => f.Bar);
    console.log(barsVilleChoisie);
    window.binchesVilleChoisie = binches.filter(f => barsVilleChoisie.includes(f.Bar));
    console.log(binchesVilleChoisie);
    window.binchesVilleChoisieavecCOO = bars.filter(f => barsVilleChoisie.includes(f.Bar))
  }


  ////////////////////////////////
  // DEFINITION VARIABLES GLOBALES ET CONSTANTES
  ////////////////////////////////

  // Définitions des éléments relatifs au scatteplot
  window.margins = {
    "left": 35,
    "right": 35,
    "top": 30,
    "bottom": 30
  };

  let svgScat = d3.select("#scatter-load").append("svg").attr("id", "scatterplot");

  // Ajuste la taille de la carte à la page (seulement initiale)
  document.getElementById('map').style.width = `${$('#conteneurCarte').width()}px`;

  let graphWidth = $('.2r2c').width() - margins.left - margins.right;
  let graphHeight = ($('.2emeRang').height() - margins.top - margins.bottom) * 2;

  const toolTip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Icône accompagnant les bières
  let beericon = "data/srm1.png";

  // Nombre de bières similaires à retourner
  const limiteSimi = 5;

  // Import de la "matrice" des distances
  const rowDistFilter = distances.filter(d => d.Ville === villechoisie);

  // Place où sauver les marqueurs
  let markers = {};
  let brassMarkersObj = {};

  // Définitions des différentes échelles
  let radius = 4.5;

  // Couleurs selon le SRM/EBC
  let SrmColorScale = d3.scaleLinear()
    .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 50])
    .range(["#FFE699", "#FFD878", "#FFCA5A", "#FFBF42", "#FBB123", "#F8A600", "#F39C00", "#EA8F00", "#E58500", "#DE7C00", "#D77200", "#CF6900", "#CB6200",
      "#C35900", "#BB5100", "#B54C00", "#B04500", "#A63E00", "#A13700", "#9B3200", "#952D00", "#8E2900", "#882300", "#821E00", "#7B1A00", "#771900",
      "#701400", "#6A0E00", "#660D00", "#5E0B00", "#5A0A02", "#600903", "#520907", "#4C0505", "#470606", "#440607", "#3F0708", "#3B0607", "#3A070B", "#36080A", "#000"
    ]);

  // Couleurs selon le bar (evtl)
  // let barColorScale = d3.scaleOrdinal(d3.schemeCategory20);

  /////////////////////////////////////////////////////////
  // PARTIES RELATIVES A LA CARTE
  ////////////////////////////////////////////////////////

  // Définition des couches de base de la carte
  const osmLayer = new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }); // Fond simple clair


  const topoLayer = new L.TileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });  // Fond terrain



  // Définition de la carte

let centerCarte =   (villechoisie == 'Lyon') ? [45.760315, 4.837746]
                    : (villechoisie == 'Avignon') ? [43.948555, 4.809927]
                    : (villechoisie == 'Lausanne') ? [46.52243400482112, 6.632995605468751]
                    : (villechoisie == 'Riga') ? [56.952365, 24.115035]
                    :   [45.499463, 5.780614] ;

let zoomCarte =   (villechoisie == 'TOUTES') ?  4
                  : (villechoisie == 'Lyon') ? 12
                  : 14;

const carte = new L.LeafletMap('map', {
    center: centerCarte,
    zoom: zoomCarte
  });

  // Ajout des couches à la carte
  carte.addLayer(osmLayer);


  // Attribution des couches de bases pour le sélecteur
  const baseMaps = {
    "Simple": osmLayer,
    "Terrain": topoLayer
  };

  // Ajout des couches au sélecteur et de ce dernier à la carte
  new L.Control.Layers(baseMaps).addTo(carte);

  // Ajout de l'échelle graphique, système métrique seulement
  new L.Control.Scale({
    imperial: false
  }).addTo(carte);

  // Ajout du bouton et fonction de localisation
  class ControleLocalisation extends L.Control {
    onAdd(map) {
      const conteneur = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const bouton = L.DomUtil.create('a', '', conteneur);
      bouton.href = '#';
      bouton.title = "Localisation de l'appareil";
      bouton.setAttribute('role', 'button');
      bouton.textContent = '◎';
      L.DomEvent.on(bouton, 'click', function (e) {
        L.DomEvent.stop(e);
        map.locate({ setView: true, maxZoom: 15 });
      });
      return conteneur;
    }
  }
  new ControleLocalisation({ position: 'topleft' }).addTo(carte);

  let positionUtilisateur;
  carte.on('locationfound', function (e) {
    if (positionUtilisateur) carte.removeLayer(positionUtilisateur);
    positionUtilisateur = new L.CircleMarker(e.latlng, { radius: 8 }).addTo(carte);
  });
  carte.on('locationerror', function () {
    alert("Localisation impossible : vérifiez l'autorisation du navigateur.");
  });

  const creerIcone = (emoji, classe) => new L.DivIcon({
    className: `marqueur ${classe}`,
    html: `<span>${emoji}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [16, 0]
  });

  const brassMarker = creerIcone('🏭', 'marqueur-brasserie');
  const barMarker = creerIcone('🍺', 'marqueur-bar');

  // Rassemblement des marqueurs brasseries en clusters
  let brassMarkers = new L.FeatureGroup();

  // Assembler les marqueurs en groupe
  let barMarkers = new L.FeatureGroup();


  ////////////////////////////////////////////////
  // AFFICHAGE VISUALISATION ET IMPORT DONNEES
  ////////////////////////////////////////////////

  // Si la fenêtre est changée de taille alors le graphique est ajusté
  window.addEventListener("resize", function() {
    drawSvg(true);
  });


  for (let i = 0; i < binchesVilleChoisieavecCOO.length; i++) {
    let bar = binchesVilleChoisieavecCOO[i];
    // Enregistrement dans un objet pour référencement futur
    markers[bar.Bar] = new L.Marker([bar.Lat, bar.Long], {
        riseOnHover: true,
        icon: barMarker
      })
      .bindTooltip(bar.Bar, {
        className: 'barTooltip'
      })
      .on("click", function(e) {
        // Retrouver quel bar a été cliqué
        let el = $(e.srcElement || e.target);
        let id = el[0]._icon.id;
        let selectedBar = id;

        // Ajustement de la page en fonction du bar sélectionné
        updateInfos(selectedBar);
        updateAllSelects(selectedBar, "bar-list");

        goToMarker(selectedBar, markers);

        pickCircles(selectedBar, "Bar");
      })
      .addTo(barMarkers)
      .addTo(carte);
    // Ajout d'un ID
    markers[bar.Bar]._icon.id = bar.Bar;

  }

  // Dict par nom et array des bières par bar
  const biereParNom = new Map(binches.map(b => [String(b.Biere), b]));
  const biereBar = binchesVilleChoisie.map(n => ({ biere: n.Biere, bar: n.Bar }));

  // Listes de valeurs
  const barsUniques = [...new Set(binchesVilleChoisie.map(d => d.Bar))].sort();
  const brasseriesUniques = [...new Set(binchesVilleChoisie.map(d => d.Brasserie))].sort();
  const bieresUniques = [...new Set(binchesVilleChoisie.map(d => d.Biere))].sort();
  const stylesUniques = [...new Set(binchesVilleChoisie.map(d => d.STYLE4))].sort();

  // Création des sélecteurs
  const tomBar = creerSelecteur('filterbar', 'bar-list', 'Un bar en particulier ?', 'TOUS', barsUniques, function() {
    const selectedBar = this.value;
    pickCircles(selectedBar, "Bar");
    updateInfos(selectedBar);
    updateAllSelects(selectedBar, "bar-list");
    goToMarker(selectedBar, markers);
  });

  const tomBrass = creerSelecteur('filterbrass', 'brass-list', 'Une brasserie à découvrir ?', 'TOUTES', brasseriesUniques, function() {
    const selectedBrasserie = this.value;
    pickCircles(selectedBrasserie, "Brasserie");
    updateInfos(selectedBrasserie);
    updateAllSelects(selectedBrasserie, "brass-list");
    goToMarker(selectedBrasserie, brassMarkersObj);
  });

  const tomBinch = creerSelecteur('filterbinch', 'binch-list', 'Une bière intéressante ?', 'TOUTES', bieresUniques, function() {
    selectionnerBiere(this.value);
  });

  const tomStyle = creerSelecteur('filterstyle', 'style-list', 'Un style de bière favori ?', 'TOUS', stylesUniques, function() {
    const selectedStyle = this.value;
    pickCircles(selectedStyle, "STYLE4");
    updateInfos(selectedStyle);
    updateAllSelects(selectedStyle, "style-list");
  });

  const selecteurs = { 'bar-list': tomBar, 'brass-list': tomBrass, 'binch-list': tomBinch, 'style-list': tomStyle };

  // Fonction qui dessine le svg et fait l'interaction avec la carte
  // prend un booleen indiquant si c'est redessiné (par ex. ajustement de la taille)

  function drawSvg(redraw) {
    //Enlever le scatterplot précédent
    $("#scatterplot").remove();

    // Récupère les valeurs des sélecteurs
    let valBar = tomBar.getValue();
    let valBrass = tomBrass.getValue();
    let valBinch = tomBinch.getValue();

    // Ajuste de façon standard la taille
    graphWidth = $('.2r2c').width() - margins.left - margins.right;
    graphHeight = ($('.2emeRang').height() - margins.top - margins.bottom) * 2.1;

    // Ajuster la taille du graphique à la fenêtre
    if (window.innerHeight < window.innerWidth && window.innerWidth < 810) {
      graphHeight *= 0.3;
    } else if (window.innerHeight < window.innerWidth && window.innerWidth < 1100) {
      graphHeight *= 0.5;
    } else if (window.innerHeight < 650) {
      graphHeight *= 0.8;
    } else if (window.innerHeight < 750) {
      graphHeight *= 0.85;
    } else if (window.innerHeight < 850) {
      graphHeight *= 0.9;
    } else if (window.innerWidth > 1100 && window.innerWidth < 1200 && window.innerHeight >= 850) {
      graphHeight *= 0.75;
    }

    // Ajout du svg et du groupe adapté aux marges
    svgScat = d3.select("#scatter-load")
      .append("svg")
      .attr("id", "scatterplot")
      .attr("width", graphWidth + margins.left + margins.right)
      .attr("height", graphHeight + margins.top + margins.bottom)
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);

    // Echelles axiales
    let xScale = d3.scaleLinear()
      .range([0, graphWidth])
      .nice();

    let yScale = d3.scaleLinear()
      .range([graphHeight, 0])
      .nice();

      // Récupération des coordonnées des brasseries
      const brasseriesLatLon = $.map(binchesVilleChoisie, function(n, i) {
        return {
          brasserie: n.Brasserie,
          Lat: n.Lat,
          Long: n.Long
        };
      });

      ////////////////////
      // ECHELLES ET AXES

      // Définition du domain des échelles selon les données
      xScale.domain(d3.extent(binchesVilleChoisie, d => d.ABV));
      yScale.domain([0, d3.max(binchesVilleChoisie, d => d.IBU)]); // si on veut que IBU commence à 0, sinon utiliser extent
      // barColorScale.domain(barsUniques);

      // Ajout des axes du graphique
      let xAxis = svgScat.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${graphHeight})`)
        .call(d3.axisBottom(xScale).tickPadding(5));

      let yAxis = svgScat.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale).tickPadding(5));

      ////////////////////
      // AJOUT CERCLES

      // Définir le rayon initial des cercles
      let initRadius = radius;

      // Si c'est un redessinage et que seul un élément est sélectionné, alors les initialiser à 0
      if (redraw && ((valBar || valBrass || valBinch) && !(valBar && valBrass && valBinch))) {
        initRadius = 0;
      }
      // Ajout des cercles
      svgScat.append("g")
        .attr("class", "ensembleBinch")
        .selectAll("circle")
        .data(binchesVilleChoisie)
        .enter()
        .append("circle")
        .attr("id", d => d.Biere)
        .attr("class", "dot")
        .attr("r", initRadius)
        .attr("cx", d => xScale(d.ABV))
        .attr("cy", d => yScale(d.IBU))
        .style("fill", d => SrmColorScale(d.SRM))
        .style("stroke", "none")
        .style("opacity", 0.5);

      // Définition des interactions sur les cercles
      svgScat.selectAll(".dot")
        .data(binchesVilleChoisie)
        .on("mouseover", function(event, d) {

          // Remplissage du tooltip
          toolTip.html(`<b>${d.Biere}</b><br><i>Style : ${d.STYLE4}\
                        <br>Amertume : ${d.IBU} IBU<br>Alcool : ${d.ABV} %\
                        <br>Brasserie : ${d.Brasserie} <br> Bar : ${d.Bar}</i>`)
            .style("left", `${event.pageX+20}px`)
            .style("top", `${event.pageY+20}px`);

          // Affichage du tooltip, disparaît pour éviter un tooltip "coincé" sur les mobiles
          toolTip.transition()
            .duration(200)
            .style("opacity", 0.95)
            .transition()
            .duration(4500)
            .style("opacity", 0);
          // Mise en évidence de la bière
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", radius * 1.5)
            .style("opacity", 1);
        })
        .on("mouseout", function(d) {
          // Disparition du toolTtp
          toolTip.transition()
            .duration(200)
            .style("opacity", 0);
          // La bière rentre dans le rang
          d3.select(this)
            .transition()
            .duration(300)
            .attr("r", radius)
            .style("opacity", 0.5);
        })
        .on("click", function(event, d) { selectionnerBiere(String(d.Biere)); });


      //////////////
      // AJOUTS VISUS CARTES
      // Pour chaque brasserie, récupèrer les coordonnées et les assigner à un marqueur
      for (let i = 0; i < brasseriesUniques.length; i++) {
        let brasserie = binchesVilleChoisie.find(d => d.Brasserie === brasseriesUniques[i]);

        brassMarkersObj[brasserie.Brasserie] = new L.Marker([brasserie.Lat, brasserie.Long], {
            riseOnHover: true,
            icon: brassMarker
          })
          .bindTooltip(brasserie.Brasserie)
          .on("click", function(e) {
            // Retrouver quelle brasserie a été cliquée et modifier la page en conséquence
            let el = $(e.srcElement || e.target);
            let id = el[0]._icon.id;
            let selectedBrass = id;

            updateInfos(selectedBrass);
            updateAllSelects(selectedBrass, "brass-list");

            goToMarker(selectedBrass, brassMarkersObj);

            pickCircles(selectedBrass, "Brasserie");
          })
          .addTo(brassMarkers)
          .addTo(carte);
        // Ajout d'un ID pour le référencement du tooltip
        brassMarkersObj[brasserie.Brasserie]._icon.id = brasserie.Brasserie;
      }


    // Légendes des axes
    svgScat.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", graphWidth - 5)
      .attr("y", graphHeight - 7)
      .text("Alcool par volume (%)");

    svgScat.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -7)
      .attr("y", 5)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text("Amertume (IBU)");

    // S'il y a un sélecteur avec une valeur, alors redessiner le graphique avec les éléments idoines
    if ((valBar || valBrass || valBinch) && !(valBar && valBrass && valBinch)) {
      // Permet de s'assurer qu'il sera fait quand les cercles seront ajoutés
      setTimeout(function() {
        if (valBar) {
          svgScat.selectAll("circle")
            .filter(d => valBar == d.Bar)
            .attr("r", radius);
        } else if (valBrass) {
          svgScat.selectAll("circle")
            .filter(d => valBrass == d.Brasserie)
            .attr("r", radius);
        } else {
          svgScat.selectAll("circle")
            .filter(d => valBinch == d.Biere)
            .attr("r", radius);
        }
      }, 50);
    }
  }
  // Dessin initial du graphique
  drawSvg(false);

  document.getElementById('Biereproches').addEventListener('click', function(e) {
    const cible = e.target.closest('[data-biere]');
    if (cible) selectionnerBiere(cible.dataset.biere);
  });

  // Rend les brasseries dans la description interactives
  document.getElementById('BrassSelectedBeer').addEventListener("click", function() {
    const selectedBrass = this.textContent.trim();
    // Faire "disparaître" les bières non correspondantes
    pickCircles(selectedBrass, "Brasserie");

    goToMarker(selectedBrass, brassMarkersObj);

    // Màj des informations et sélecteurs
    updateInfos(selectedBrass);
    updateAllSelects(selectedBrass, "brass-list");

  });

  // Rend les bars où la bière est disponible interactifs
  document.getElementById('BarSelectedBeer').addEventListener("click", function(e) {
    if (e.target !== e.currentTarget) {
      const selectedBar = e.target.textContent.replace(/ \| $/, '');

      pickCircles(selectedBar, "Bar");

      goToMarker(selectedBar, markers);

      // Màj des informations et sélecteurs
      updateInfos(selectedBar);
      updateAllSelects(selectedBar, "bar-list");
    }
    e.stopPropagation();
  });


  // MàJ des sélecteurs et "réinitialisation" si tout est sélectionné
  function updateAllSelects(selected, selectId) {
    if (selected == 'TOUTES' || selected == 'TOUS') {
      for (const ts of Object.values(selecteurs)) ts.clear(true); // true = sans déclencher d'événement
      svgScat.selectAll("circle")
        .transition()
        .duration(500)
        .attr("r", radius);
    } else {
      for (const [id, ts] of Object.entries(selecteurs)) {
        if (id === selectId) ts.setValue(selected, true);
        else ts.clear(true);
      }
    }
  }

  // Actualisation des informations relatives à la brasserie, au bar et/ou aux bières
  function updateInfos(selected, listeBiere, listeBar) {
    $('.infoSelected').html("");
    $('#Biereproches').html("");
    if (selected == 'TOUTES' || selected == 'TOUS') {
      $('#selectedBeer').html("");
    } else if (listeBiere) {
      let binch = listeBiere.find(d => String(d.Biere) === selected);
      $('#BrassSelectedBeer').html(`${binch.Brasserie} <br>`);
      $('#selectedBeer').html(`${binch.Biere} &ensp; <i id ='brasspar'> brassée par  </i> &ensp;`);
      $('#ABVselectedBeer').html(`Alcool : ${binch.ABV} % | `);
      $('#IBUselectedBeer').html(`${binch.IBU} IBU  &ensp; <i id ='brasspar'> disponible chez  </i> &ensp;`);
      $('#StyleSelectedBeer').html(`${binch.STYLE4} | `);
      for (let i = 0; i < listeBar.length; i++) {
        if (listeBar[i].biere == selected) {
          document.getElementById('BarSelectedBeer').innerHTML += `<span class="barDispo">${listeBar[i].bar} | </span>`;
        }
      }
    } else {
      $('#selectedBeer').html(selected);
    }
  }

  // Déplace la carte sur le marker, ouvre son tooltip et le met en avant
  function goToMarker(selected, couche, listeBiere) {
    // Ferme les tooltips encore ouverts
    carte.eachLayer(function(l) {
      l.closeTooltip?.();
    });
    // Si tout est sélectionné, alors retour sur l'ensemble des bars
    if (selected == 'TOUS' || selected == 'TOUTES') {
      carte.flyToBounds(barMarkers.getBounds());
    } else {
      if (listeBiere) {
        let brass = listeBiere.find(d => d.Biere == selected).Brasserie;
        selected = brass;
      }
      carte.flyTo(couche[selected].getLatLng(), 15);
      couche[selected].openTooltip();
      couche[selected].setZIndexOffset(1000);
    }
  }

  function afficherSimilaires(nom) {
    const conteneur = document.getElementById('Biereproches');
    conteneur.replaceChildren();
    if (nom === 'TOUTES') return;
    
    // Récupérer les bières proches
    const proches = (rowDistFilter)
      .filter(r => r.Source === nom && r.weight < 0.5)
      .sort((a, b) => a.weight - b.weight)
      .slice(0, limiteSimi);

    const titre = document.createElement('h3');
    titre.id = 'titreSimi';
    titre.textContent = `Similaires à ${nom}`;
    conteneur.append(titre, document.createElement('br'));

    // Créer la ligne logo et nom des proches
    for (const r of proches) {
      const logo = document.createElement('img');
      logo.className = 'bProches';
      logo.alt = '';
      logo.src = adjustLogo(biereParNom.get(r.Target).SRM);
      logo.dataset.biere = r.Target;

      const nomBiere = document.createElement('b');
      nomBiere.className = 'bProches';
      nomBiere.textContent = r.Target;
      nomBiere.dataset.biere = r.Target;

      conteneur.append(logo, nomBiere, document.createElement('br'));
    }

    // Les bières proches apparaissent en petit sur le graphique
    const cibles = new Set(proches.map(r => r.Target));
    svgScat.selectAll('circle')
      .filter(d => cibles.has(String(d.Biere)))
      .transition()
      .duration(200)
      .attr('r', radius * 0.5);
  }

  function selectionnerBiere(nom) {
    pickCircles(nom, 'Biere', 300);
    updateInfos(nom, binchesVilleChoisie, biereBar);
    updateAllSelects(nom, 'binch-list');
    goToMarker(nom, brassMarkersObj, binchesVilleChoisie);
    afficherSimilaires(nom);
  }

  // Détermine quels cercles sont à conserver sur le graphique
  function pickCircles(selected, champ, t = 400) {
    svgScat.selectAll('circle')
      .transition()
      .duration(t)
      .attr("r", 0)
      .filter(d => String(d[champ]) === selected)
      .transition()
      .duration(t)
      .attr("r", radius);
  }

};

// Permet d'ajuster le logo en fonction du SRM
adjustLogo = function(srmBinche) {
  let logoDef;

  if (srmBinche >= 25) {
    logoDef = "data/srm6.png";
  } else if (srmBinche >= 20 && srmBinche < 25) {
    logoDef = "data/srm5.png";
  } else if (srmBinche >= 15 && srmBinche < 20) {
    logoDef = "data/srm4.png";
  } else if (srmBinche >= 10 && srmBinche < 15) {
    logoDef = "data/srm3.png";
  } else if (srmBinche >= 5 && srmBinche < 10) {
    logoDef = "data/srm2.png";
  } else {
    logoDef = "data/srm1.png";
  }

  return logoDef;
}
