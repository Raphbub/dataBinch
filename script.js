/*jshint esnext: true */

////////////////////////////////
// DEFINITION VARIABLES GLOBALES ET CONSTANTES
////////////////////////////////
let dropDownBar = d3.select("#filterbar")
  .append("select")
  .attr("id", "bar-list")
  .attr("class", "selectpicker")
  .attr("class", "selecteur")
  .attr("title", "Un bar en particulier ?");

let dropDownBrass = d3.select("#filterbrass")
  .append("select")
  .attr("id", "brass-list")
  .attr("class", "selectpicker")
  .attr("class", "selecteur")
  .attr("title", "Tapez pour rechercher");

let dropDownBinch = d3.select("#filterbinch")
  .append("select")
  .attr("id", "binch-list")
  .attr("class", "selectpicker")
  .attr("class", "selecteur")
  .attr("title", "Tapez pour rechercher");

// Définitions des éléments relatifs au scatteplot
const margins = {
  "left": 35,
  "right": 35,
  "top": 30,
  "bottom": 30
};

let svgScat = d3.select("#scatter-load").append("svg").attr("id", "SCATTERPLOT");

document.getElementById('map').style.width = `${$('#conteneurCarte').width()}px`;

let graphWidth = $('.2r2c').width() - margins.left - margins.right;
let graphHeight = ($('.2emeRang').height() - margins.top - margins.bottom) * 2;

const toolTip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const beericon = "data/beericon.png";

const limiteSimi = 5;

let rowDist;

d3.csv('data/rowdist.csv', function(error, data) {
  if (error) {
    console.log(error);
  }
  data.forEach(d => d.weight = +d.Weight);
  rowDist = data;
});
// Add a place to save markers
let markers = {};

// Définitions des différentes échelles
let radius = 4.5;

// Couleurs selon le ,SRM/EBC
let SrmColorScale = d3.scaleLinear()
  .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 50])
  .range(["#FFE699", "#FFD878", "#FFCA5A", "#FFBF42", "#FBB123", "#F8A600", "#F39C00", "#EA8F00", "#E58500", "#DE7C00", "#D77200", "#CF6900", "#CB6200",
    "#C35900", "#BB5100", "#B54C00", "#B04500", "#A63E00", "#A13700", "#9B3200", "#952D00", "#8E2900", "#882300", "#821E00", "#7B1A00", "#771900",
    "#701400", "#6A0E00", "#660D00", "#5E0B00", "#5A0A02", "#600903", "#520907", "#4C0505", "#470606", "#440607", "#3F0708", "#3B0607", "#3A070B", "#36080A", "#000"
  ]);

// Couleurs selon le bar
let barColorScale = d3.scaleOrdinal(d3.schemeCategory20);

/////////////////////////////////////////////////////////
// PARTIES RELATIVES A LA CARTE
////////////////////////////////////////////////////////

//Définition des couches de base de la carte
const cartodbLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}); // Fond simple clair

const stamenLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  ext: 'png'
}); // Fond terrain

// Définition de la carte
const carte = L.map('map', {
  center: [46.52243400482112, 6.632995605468751],
  zoom: 15
});

// Ajout des couches à la carte
carte.addLayer(cartodbLayer, stamenLayer);

// Attribution des couches de bases pour le sélecteur
const baseMaps = {
  "Simple": cartodbLayer,
  "Terrain": stamenLayer
};

// Ajout des couches au sélecteur
L.control.layers(baseMaps).addTo(carte);

// Ajout de l'échelle graphique, système métrique seulement
L.control.scale({
  imperial: false
}).addTo(carte);

// Ajout du bouton et fonction de localisation
L.control.locate({
  strings: {
    title: "Localisation de l'appareil"
  }
}).addTo(carte);

$('#conteneurCarte').css("margin-top", "10px");

// Définition du style des marqueurs des brasseries
const brassMarker = L.AwesomeMarkers.icon({
  icon: 'industry',
  prefix: 'fa',
  markerColor: 'white',
  iconColor: 'black'
});

// Définition du style des marqueurs des bars
const barMarker = L.AwesomeMarkers.icon({
  icon: 'beer',
  prefix: 'fa',
  markerColor: 'blue',
  iconColor: 'white'
});

// Rassemblement des marqueurs brasseries en clusters
let brassMarkers = L.markerClusterGroup({
  showCoverageOnHover: false, //Ne pas montrer les limites
  disableClusteringAtZoom: 12,
  spiderfyOnMaxZoom: false
});

let barMarkers = L.featureGroup();



// A voir si on veut cluster les bars... TODO
// let barMarkers = L.markerClusterGroup({
//   showCoverageOnHover: false, //Ne pas montrer les limites
// });

////////////////////////////////////////////////
// IMPORT DONNEES ET AFFICHAGE VISUALISATION
////////////////////////////////////////////////
window.addEventListener("resize", function() {
  drawSvg(true);
});

// Fonction qui dessine le svg et fait l'interaction avec la carte
// prend un booleen indiquant si c'est redessiné (par ex. ajustement de la taille)
function drawSvg(redraw) {
  //Enlever le scatterplot précédent
  $("#SCATTERPLOT").remove();

  // Récupère les valeurs des sélecteurs
  let valBar = $('#bar-list').val();
  let valBrass = $('#brass-list').val();
  let valBinch = $('#binch-list').val();

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
  } else if (window.innerWidth > 1100 && window.innerWidth < 1200 && window.innerHeight > 850) {
    graphHeight *= 0.8;
  }

  // Ajout du svg et du groupe adapté aux marges
  svgScat = d3.select("#scatter-load")
    .append("svg")
    .attr("id", "SCATTERPLOT")
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

  //Import du fichier principal
  d3.json('data/binches.json', function(error, binches) {
    if (error) { // Si le fichier n'est pas chargé, log de l'erreur
      console.log(error);
    }

    // Récupération des différents bars, bières et brasseries
    const bars = [...new Set(binches.map(item => item.Bar).sort())];
    const biereUnique = [...new Set(binches.map(item => item.Biere).sort())];
    const brasserieUnique = [...new Set(binches.map(item => item.Brasserie).sort())];

    // liste des bar où se trouvent les bières
    const biereBar = $.map(binches, function(n, i) {
      return {
        biere: n.Biere,
        bar: n.Bar
      };
    });

    // Récupération des coordonnées des brasseries
    const brasseriesLatLon = $.map(binches, function(n, i) {
      return {
        brasserie: n.Brasserie,
        Lat: n.Lat,
        Long: n.Long
      };
    });

    //////////////
    // SELECTEURS
    // Définition des sélecteurs de bars, brasseries et bières

    // BARS select
    // Assignement des bars au sélecteur
    let optDropBar = dropDownBar.selectAll("option")
      .data(["TOUS"].concat(bars))
      .enter()
      .append("option");

    // Ajout du texte
    optDropBar.text(d => d)
      .attr("value", d => d);

    // Fonction à la sélection d'un bar
    dropDownBar.on("change", function() {

      let selectedBar = this.value;

      // Ferme les tooltips encore ouverts  // TODO n'agir que sur les bars ferait gagner du temps
      carte.eachLayer(function(l) {
        carte.closeTooltip(l.getTooltip());
      });

      // Faire "disparaître" les bières des bars non correspondants
      svgScat.selectAll("circle")
        .filter(d => selectedBar !== d.Bar)
        .transition()
        .duration(800)
        .attr("r", 0);
      // Remettre les bières correspondantes
      svgScat.selectAll("circle")
        .filter(d => selectedBar == d.Bar)
        .transition()
        .duration(800)
        .attr("r", radius);

      // Màj des informations et sélecteurs
      updateInfos(selectedBar);
      updateAllSelects(selectedBar);

      // Déplace la carte pour centrer sur le bar sélectionné, ouvre le tooltip et le met au premier plan
      if (selectedBar != 'TOUS') {
        carte.flyTo(markers[$('select#bar-list.selecteur').val()].getLatLng(), 18);
        markers[$('select#bar-list.selecteur').val()].openTooltip();
        markers[$('select#bar-list.selecteur').val()].setZIndexOffset(1000);
      }

      console.log("Bar choisi :" + $('select#bar-list.selecteur').val() + ", un bar magnifique");
    });

    // BINCHES select
    // Assignement des bières au sélecteur
    let optDropBinch = dropDownBinch.selectAll("option")
      .data(["TOUTES"].concat(biereUnique))
      .enter()
      .append("option")
      .attr("class", "optionsBiere");

    // Ajout du texte
    optDropBinch.text(d => d)
      .attr("value", d => d);


    // Fonction à la sélection d'une bière
    dropDownBinch.on("change", function() {
      let selectedBinch = this.value;

      // Faire "disparaître" les bières non correspondantes
      svgScat.selectAll("circle")
        .transition()
        .duration(200)
        .attr("r", 0)
        .filter(d => selectedBinch == d.Biere)
        .transition()
        .duration(200)
        .attr("r", radius)
        .style("opacity", 1);

      // Déplace la carte sur la brasserie d'où vient la bière
      if (selectedBinch != 'TOUTES') {
        let binch = binches.find(d => d.Biere === selectedBinch);
        carte.flyTo(new L.LatLng(binch.Lat, binch.Long), 12);
      }

      /////// RETOUR DES BIERES SIMILAIRES

      // Tri de la distance selon la bière
      let filtered = rowDist.filter(item => item.Source === selectedBinch);
      let rankdist = filtered.filter(item => item.weight < 0.5);
      rankdist.sort((a, b) => a.weight - b.weight);

      // Ajustement du titre
      document.getElementById('Biereproches').innerHTML += `<h3 id="titreSimi">Similaires à ${selectedBinch}</h3><br>`;
      // Vérifier que la limite du nombre de bière n'est pas inférieur à celle définie
      let limite;
      if (limiteSimi > rankdist.length) {
        limite = rankdist.length;
      } else {
        limite = limiteSimi;
      }
      // Pour les x (limite) bières les plus proches, afficher leur nom avec un logo et les mettres sur le graphe en petit
      for (let i = 0; i < limite; i++) {
        document.getElementById('Biereproches').innerHTML += `<img id=${i} class="bProches" src=${beericon}><b id=${i} class="bProches">${rankdist[i].Target}</b><br>`;
        d3.selectAll('circle')
          .filter(d => rankdist[i].Target == d.Biere)
          .transition()
          .duration(100)
          .attr("r", radius * 0.5);
      }

      // Màj des informations et sélecteurs
      updateInfos(selectedBinch, binches, biereBar);
      updateAllSelects(selectedBinch);

      // Ajout d'un evtLis qui rend les bières similaires interactives
      document.getElementById('Biereproches').addEventListener("click", function(event) {
        // Vérifie que le click est fait sur une bière
        if (!isNaN(event.target.id)) {
          // Récupération de la bière sélectionnée
          let biereProcheSelect = rankdist[event.target.id].Target;
          // Ajustement du graphique
          svgScat.selectAll("circle")
            .transition()
            .duration(200)
            .attr("r", 0)
            .filter(d => biereProcheSelect == d.Biere)
            .transition()
            .duration(200)
            .attr("r", radius);

          // Tri de la distance selon la bière
          let filtered = rowDist.filter(item => item.Source === biereProcheSelect);
          rankdist = filtered.filter(item => item.weight < 0.5);
          rankdist.sort((a, b) => a.weight - b.weight);

          // Màj des informations relatives à la bière sur la page
          document.getElementById('Biereproches').innerHTML = `<h3 id="titreSimi">Similaires à ${biereProcheSelect}</h3><br>`; //"<h3>Similaires à "+d.Biere+" </h3><br>";

          // Vérifier que la limite du nombre de bière n'est pas inférieur à celle définie
          let limite;
          if (limiteSimi > rankdist.length) {
            limite = rankdist.length;
          } else {
            limite = limiteSimi;
          }

          // Pour les x (limite) bières les plus proches, afficher leur nom avec un logo et les mettres sur le graphe en petit
          for (let i = 0; i < limite; i++) {
            document.getElementById('Biereproches').innerHTML += `<img id=${i} class="bProches" src=${beericon}><b id=${i} class="bProches">${rankdist[i].Target}</b><br>`; //("<img src='"+beericon+"'>"+ "<b>" + rankdist[i].Target +"</b><br>");
            d3.selectAll('circle')
              .filter(d => rankdist[i].Target == d.Biere)
              .transition()
              .duration(100)
              .attr("r", radius * 0.5);
          }

          // Màj des informations et sélecteurs
          updateInfos(selectedBinch, binches, biereBar);
          updateAllSelects(selectedBinch, "binch-list");

          // Déplace la carte sur la brasserie d'où vient la bière
          let binch = binches.find(d => d.Biere === biereProcheSelect);
          carte.flyTo(new L.LatLng(binch.Lat, binch.Long), 12);
        }
      });
    });

    // BRASSERIES select
    // Assignement des brasseries au sélecteur
    let optDropBrass = dropDownBrass.selectAll("option")
      .data(["TOUTES"].concat(brasserieUnique))
      .enter()
      .append("option")
      .attr("class", "optionsBrass");

    // Ajout du texte
    optDropBrass.text(d => d)
      .attr("value", d => d);

    // Fonction à la sélection d'une brasserie
    dropDownBrass.on("change", function() {

      let selectedBrasserie = this.value;

      // Mieux avec brasseriesLatLon.find() ?? TODO
      for (let i = 0; i < brasseriesLatLon.length; i++) {
        if (selectedBrasserie == brasseriesLatLon[i].brasserie) {
          let brassLocLat = brasseriesLatLon[i].Lat;
          let brassLocLong = brasseriesLatLon[i].Long;
          carte.flyTo(new L.LatLng(brassLocLat, brassLocLong), 12);
        }
      }

      // Faire "disparaître" les bières non correspondantes
      svgScat.selectAll("circle")
        .filter(d => selectedBrasserie !== d.Brasserie)
        .transition()
        .duration(800)
        .attr("r", 0);
      // Remettre les bières correspondantes
      svgScat.selectAll("circle")
        .filter(d => selectedBrasserie == d.Brasserie)
        .transition()
        .duration(800)
        .attr("r", radius);

      // Màj des informations et sélecteurs
      updateInfos(selectedBrasserie);
      updateAllSelects(selectedBrasserie);
    });

    ////////////////////
    // ECHELLES ET AXES

    // Définition du domain des échelles selon les données
    xScale.domain(d3.extent(binches, d => d.ABV));
    yScale.domain([0, d3.max(binches, d => d.IBU)]); // si on veut que IBU commence à 0, sinon utiliser extent
    barColorScale.domain(bars);

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
    .data(binches)
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
      .data(binches)
      .on("mouseover", function(d) {

        // Remplissage du tooltip
        toolTip.html(`<b>${d.Biere}</b><br><i>Style : ${d.STYLE4}\
                      <br>Amertume : ${d.IBU} IBU<br>Alcool : ${d.ABV} %\
                      <br>Brasserie : ${d.Brasserie} <br> Bar : ${d.Bar}</i>`)
          .style("left", `${d3.event.pageX+20}px`)
          .style("top", `${d3.event.pageY+20}px`);

        // Affichage du tooltip, disparaît pour éviter un tooltip "coincé" sur les mobiles
        toolTip.transition()
          .duration(200)
          .style("opacity", 0.9)
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
      .on("click", function(d) {
        let clickedBeer = this.id;

        // Faire "disparaître" les bières non correspondantes
        svgScat.selectAll("circle")
          .transition()
          .duration(200)
          .attr("r", 0)
          .filter(d => clickedBeer == d.Biere)
          .transition()
          .duration(200)
          .attr("r", radius);

        // Màj des informations et sélecteurs
        updateInfos(clickedBeer, binches, biereBar);
        updateAllSelects(clickedBeer, "binch-list");
        // Déplace la carte sur la brasserie
        carte.flyTo(new L.LatLng(d.Lat, d.Long), 12);

        /////// RETOUR DES BIERES SIMILAIRES

        // Tri de la distance selon la bière
        let filtered = rowDist.filter(item => item.Source === d.Biere);
        let rankdist = filtered.filter(item => item.weight < 0.5);
        rankdist.sort((a, b) => a.weight - b.weight);

        // Ajustement du titre
        document.getElementById('Biereproches').innerHTML += `<h3 id="titreSimi">Similaires à ${d.Biere}</h3><br>`; //"<h3>Similaires à "+d.Biere+" </h3><br>";
        // Vérifier que la limite du nombre de bière n'est pas inférieur à celle définie
        let limite;
        if (limiteSimi > rankdist.length) {
          limite = rankdist.length;
        } else {
          limite = limiteSimi;
        }
        // Pour les x (limite) bières les plus proches, afficher leur nom avec un logo et les mettres sur le graphe en petit
        for (let i = 0; i < limite; i++) {
          document.getElementById('Biereproches').innerHTML += `<img id=${i} class="bProches" src=${beericon}><b id=${i} class="bProches">${rankdist[i].Target}</b><br>`; //("<img src='"+beericon+"'>"+ "<b>" + rankdist[i].Target +"</b><br>");
          d3.selectAll('circle')
            .filter(d => rankdist[i].Target == d.Biere)
            .transition()
            .duration(100)
            .attr("r", radius * 0.5);
        }
        // Ajout d'un evtLis qui rend les bières similaires interactives
        document.getElementById('Biereproches').addEventListener("click", function(event) {
          // Vérifie que le click est fait sur une bière
          if (!isNaN(event.target.id)) {
            // Récupération de la bière sélectionnée
            let biereProcheSelect = rankdist[event.target.id].Target;
            // Ajustement du graphique
            svgScat.selectAll("circle")
              .transition()
              .duration(200)
              .attr("r", 0)
              .filter(d => biereProcheSelect == d.Biere)
              .transition()
              .duration(200)
              .attr("r", radius);

            // Tri de la distance selon la bière
            let filtered = rowDist.filter(item => item.Source === biereProcheSelect);
            rankdist = filtered.filter(item => item.weight < 0.5);
            rankdist.sort((a, b) => a.weight - b.weight);

            // Màj des informations relatives à la bière sur la page
            updateInfos(biereProcheSelect, binches, biereBar);
            updateAllSelects(biereProcheSelect, "binch-list")
            document.getElementById('Biereproches').innerHTML = `<h3 id="titreSimi">Similaires à ${biereProcheSelect}</h3><br>`; //"<h3>Similaires à "+d.Biere+" </h3><br>";

            // Màj des informations relatives à la bière sur la page
            let limite;
            if (limiteSimi > rankdist.length) {
              limite = rankdist.length;
            } else {
              limite = limiteSimi;
            }
            // Pour les x (limite) bières les plus proches, afficher leur nom avec un logo et les mettres sur le graphe en petit
            for (let i = 0; i < limite; i++) {
              document.getElementById('Biereproches').innerHTML += `<img id=${i} class="bProches" src=${beericon}><b id=${i} class="bProches">${rankdist[i].Target}</b><br>`; //("<img src='"+beericon+"'>"+ "<b>" + rankdist[i].Target +"</b><br>");
              d3.selectAll('circle')
                .filter(d => rankdist[i].Target == d.Biere)
                .transition()
                .duration(100)
                .attr("r", radius * 0.5);
            }
            // Déplace la carte sur la brasserie d'où vient la bière
            let binch = binches.find(d => d.Biere === biereProcheSelect);
            carte.flyTo(new L.LatLng(binch.Lat, binch.Long), 12);
          }
        });
      });


    //////////////
    // AJOUTS VISUS CARTES
    // Pour chaque brasserie, récupèrer les coordonnées et les assigner à un marqueur
    brasserieUnique.forEach(function(brass) {
      let brasserie = binches.find(d => d.Brasserie === brass);

      let marker = new L.marker([brasserie.Lat, brasserie.Long], {
          icon: brassMarker
        }).bindTooltip(brasserie.Brasserie)
        .addTo(brassMarkers)
        .on("click", function(d) {
          let selectedBrass = brasserie.Brasserie;
          updateInfos(selectedBrass);
          updateAllSelects(selectedBrass, "brass-list");

          svgScat.selectAll("circle")
            .data(binches)
            .filter(d => selectedBrass !== d.Brasserie)
            .transition()
            .duration(800)
            .attr("r", 0);

          svgScat.selectAll("circle")
            .data(binches)
            .filter(d => selectedBrass == d.Brasserie)
            .transition()
            .duration(800)
            .attr("r", radius);
        });
    });
    // Ajout de la couche des marqueurs de brasserie à la carte
    carte.addLayer(brassMarkers);
  });

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

  // Si il y a un sélecteur avec une valeur, alors redessiner le graphique avec les éléments idoines
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

//////////////////////
// VISUS CARTES : BARS

// Import du fichier des bars et ajout à la carte
d3.json('data/bars.json', function(error, barsLsne) {
  if (error) { // Si le fichier n'est pas chargé, log de l'erreur
    console.log(error);
  }
  // Ajout d'un marker par bar
  for (let i = 0; i < barsLsne.length; i++) {
    let bar = barsLsne[i];
    // Enregistrement dans un objet pour référencement futur
    markers[bar.Bar] = L.marker([bar.Lat, bar.Long], {
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

      if (selectedBar != 'TOUS') {
        carte.flyTo(markers[id].getLatLng())

        svgScat.selectAll("circle")
        .filter(d => selectedBar !== d.Bar)
        .transition()
        .duration(300)
        .attr("r", 0);

        svgScat.selectAll("circle")
        .filter(d => selectedBar == d.Bar)
        .transition()
        .duration(300)
        .attr("r", radius);
      }
    })
    .addTo(barMarkers)
    .addTo(carte);

    // Ajout d'un ID
    markers[bar.Bar]._icon.id = bar.Bar;

    // for (let i = 0 ; i < barsLsne.length; i++) {
    //   let marker = new L.marker([barsLsne[i].Lat, barsLsne[i].Long], {icon: barMarker})
    //       .bindPopup(barsLsne[i].Bar)
    //       .addTo(carte); //.addTo(barMarkers); si cluster
    // }
    // carte.addLayer(barMarkers); si cluster
  }
});

// MàJ des sélecteurs et "réinitialisation" si tout est sélectionné
function updateAllSelects(selected, selectId) {
  if (selected == 'TOUTES' || selected == 'TOUS') {
    $('.selecteur').each(function() {
      this.selectedIndex = 0;
    });

    carte.flyToBounds(barMarkers.getBounds());

    svgScat.selectAll("circle")
      .transition()
      .duration(500)
      .attr("r", radius);

  } else {
    $('.selecteur').each(function() {
      // Vérifie si le sélecteur n'est pas déjà à jour
      if (this.value != selected) {
        // Sinon attribue au bon sélecteur la valeur en cours
        if (this.id == selectId) {
          this.value = selected;
        } else {
          this.value = "";
        }
      }
    });
  }
}
// Actualisation des informations relatives à la brasserie, au bar et/ou aux bières
function updateInfos(selected, listeBiere, listeBar) {
  $('.infoSelected').html("");
  $('#Biereproches').html("");
  if (selected == 'TOUTES' || selected == 'TOUS') {
    $('#selectedBeer').html("");
  } else if (listeBiere) {
    let binch = listeBiere.find(d => d.Biere === selected);
    $('#BrassSelectedBeer').html(`${binch.Brasserie} <br>`);
    $('#selectedBeer').html(`${binch.Biere} &ensp; <i id ='brasspar'> brassée par  </i> &ensp;`);
    $('#ABVselectedBeer').html(`Alcool : ${binch.ABV} % | `);
    $('#IBUselectedBeer').html(`${binch.IBU} IBU  &ensp; <i id ='brasspar'> disponible chez  </i> &ensp;`);
    $('#StyleSelectedBeer').html(`${binch.STYLE4} | `);
    for (let i = 0; i < listeBar.length; i++) {
      if (listeBar[i].biere == selected) {
        document.getElementById('BarSelectedBeer').innerHTML += listeBar[i].bar + " | ";
      }
    }
  } else {
    $('#selectedBeer').html(selected);
  }
}

// Rend les brasseries dans la description interactives
document.getElementById('BrassSelectedBeer').addEventListener("click", function(){
  let selectedBrass = $('#BrassSelectedBeer').html().slice(0, -5);
  // Faire "disparaître" les bières non correspondantes
  svgScat.selectAll("circle")
    .filter(d => selectedBrass !== d.Brasserie)
    .transition()
    .duration(800)
    .attr("r", 0);
  // Remettre les bières correspondantes
  svgScat.selectAll("circle")
    .filter(d => selectedBrass == d.Brasserie)
    .transition()
    .duration(800)
    .attr("r", radius);

  // Màj des informations et sélecteurs
  updateInfos(selectedBrass);
  updateAllSelects(selectedBrass);
});

// Dessin initial du graphique
drawSvg(false);
