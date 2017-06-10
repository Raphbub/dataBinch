/*jshint esnext: true */


////////////////////////////////
// DEFINITION VARIABLES GLOBALES ET CONSTANTES
////////////////////////////////

// Définition des sélecteurs de bars, brasseries et bières
const dropDownBar = d3.select('#filterbar')
                      .append("select")
                      .attr("id", "bar-list")
                      .attr("class","selectpicker")
                      .attr("title", "Un bar en particulier ?");

const dropDownBrass = d3.select('#filterbrass')
                        .append("select")
                        .attr("id", "brass-list")
                        .attr("class","selectpicker")
                        .attr("data-live-search","true")
                        .attr("title", "Tapez pour rechercher");

const dropDownBinch = d3.select('#filterbinch')
                        .append("select")
                        .attr("id", "binch-list")
                        .attr("class","selectpicker")
                        .attr("data-live-search","true")
                        .attr("title", "Tapez pour rechercher");

// Définitions des éléments relatifs au scatteplot
const margins = {"left": 40, "right": 30, "top": 30, "bottom": 30};

const width = $('.2r2c').width() - margins.left - margins.right;
const height = $('.2emeRang').height() - margins.top - margins.bottom;

const svgScat = d3.select("#scatter-load")
                .append("svg")
                .attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom)
                .append("g")
                .attr("transform", `translate(${margins.left},${margins.top})`);

const toolTip = d3.select("body")
                  .append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);

let beericon = "beericon.png";

// Add a place to save markers
let markers = {};

// Définitions des différentes échelles
let radius = 4.5;

// Axiales
let xScale = d3.scaleLinear()
               .range([0, width])
               .nice();

let yScale = d3.scaleLinear()
               .range([height, 0])
               .nice();

// Couleurs selon le ,SRM/EBC
let SrmColorScale = d3.scaleLinear()
                   .domain([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,50])
                   .range(["#FFE699","#FFD878","#FFCA5A","#FFBF42","#FBB123","#F8A600","#F39C00","#EA8F00","#E58500","#DE7C00","#D77200","#CF6900","#CB6200",
                          "#C35900","#BB5100","#B54C00","#B04500","#A63E00","#A13700","#9B3200","#952D00","#8E2900","#882300","#821E00","#7B1A00","#771900",
                          "#701400","#6A0E00","#660D00","#5E0B00","#5A0A02","#600903","#520907","#4C0505","#470606","#440607","#3F0708","#3B0607","#3A070B", "#36080A","#000"]);

// Couleurs selon le bar
let barColorScale = d3.scaleOrdinal(d3.schemeCategory20);

/////////////////////////////////////////////////////////
// PARTIES RELATIVES A LA CARTE
////////////////////////////////////////////////////////

//Définition des couches de base de la carte
const cartodbLayer =  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',{
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}); // Fond simple clair

const stamenLayer =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  ext: 'png'
}); // Fond terrain

// Définition de la carte
const map = L.map('map', {
  center: [46.52243400482112, 6.632995605468751],
  zoom: 15
});

// Ajout des couches à la carte
map.addLayer(cartodbLayer, stamenLayer);

// Attribution des couches de bases pour le sélecteur
const baseMaps = {
  "Simple": cartodbLayer,
  "Terrain": stamenLayer
};

// Ajout des couches au sélecteur
L.control.layers(baseMaps).addTo(map);

// Ajout de l'échelle graphique, système métrique seulement
L.control.scale({imperial: false}).addTo(map);

// Ajout du bouton et fonction de localisation
L.control.locate({strings: {title: "Localisation de l'appareil"}}).addTo(map);

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

// Visualisation des bières
d3.json('binches.json', function(error, binches) {
  if (error) { // Si le fichier n'est pas chargé, log de l'erreur
    console.log(error);
  }

  // Récupération des différents bars, bières et brasseries
  const bars = [...new Set(binches.map(item => item.Bar))];
  const biereUnique = [...new Set(binches.map(item => item.Biere))];
  const brasserieUnique = [...new Set(binches.map(item => item.Brasserie))];

  //////////////
  // SELECTEURS

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
  dropDownBar.on("change", function(binches) {
    let selectedBar = this.value;
    // Réinitialise les options des autres selects (brasserie et bière) pour clarifier
    $('#brass-list').val("");
    $('#brass-list').selectpicker("refresh");

    $('#binch-list').val("");
    $('#binch-list').selectpicker("refresh");

    // Si tous les bars sont sélectionnés leur mettre la même taille
    if (selectedBar == 'TOUS') {
      svgScat.selectAll("circle")
             .transition()
             .duration(800)
             .attr("r", radius);
      // Déplacer la carte pour voir tous les bars
      map.flyToBounds(barMarkers.getBounds(), {duration: 0.8});
    } else {
      // Faire "disparaître" les bières des bars non correspondants
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBar !== d.Bar;})
             .transition()
             .duration(800)
             .attr("r", 0);
      // Remettre les bières correspondantes
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBar == d.Bar;})
             .transition()
             .duration(800)
             .attr("r", radius);
    }
    console.log("Bar choisi :" + $('select#bar-list.selectpicker').val() + ", un bar magnifique");
    // Déplace la carte pour centrer sur le bar sélectionné et ouvre son popup
    map.flyTo(markers[$('select#bar-list.selectpicker').val()].getLatLng(), 18/*, {duration: 1} TODO Mettre une durée?*/);
    markers[$('select#bar-list.selectpicker').val()].openTooltip();
  });

  // BINCHES select
  // Assignement des bières au sélecteur
  let optDropBinch = dropDownBinch.selectAll("option")
                      .data(["TOUTES"].concat(biereUnique))
                      .enter()
                      .append("option");

  // Ajout du texte
  optDropBinch.text(d => d)
              .attr("value", d => d);

    // Fonction à la sélection d'une bière
  dropDownBinch.on("change", function(binches) {
    let selectedBinch = this.value;
    // Réinitialise les options des autres selects (brasserie et bar) pour clarifier
    $('#brass-list').val("");
    $('#brass-list').selectpicker("refresh");

    $('#bar-list').val("");
    $('#bar-list').selectpicker("refresh");

    // Si toutes les bières sont sélectionnées leur mettre la même taille
    if (selectedBinch == 'TOUTES') {
      svgScat.selectAll("circle")
            .attr("r", radius);

      // Déplacer la carte pour voir tous les bars
      map.flyToBounds(barMarkers.getBounds(), {duration: 0.8});
    } else {
      // Faire "disparaître" les bières non correspondantes
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBinch !== d.Biere;})
             .transition()
             .duration(800)
             .attr("r", 0);
      // Remettre les bières correspondantes
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBinch == d.Biere;})
             .transition()
             .duration(800)
             .attr("r", radius);

      console.log("Bière choisie :" + selectedBinch + ", très bon choix !");
    }
  });

  // BRASSERIES select
  // Assignement des brasseries au sélecteur
  let optDropBrass = dropDownBrass.selectAll("option")
                      .data(["TOUTES"].concat(brasserieUnique))
                      .enter()
                      .append("option");

  // Ajout du texte
  optDropBrass.text(d => d)
              .attr("value", d => d);

  // Fonction à la sélection d'une brasserie
  dropDownBrass.on("change", function() {
    let selectedBrasserie = this.value;
    // Réinitialise les options des autres selects (bar et bière) pour clarifier
    $('#bar-list').val("");
    $('#bar-list').selectpicker("refresh");

    $('#binch-list').val("");
    $('#binch-list').selectpicker("refresh");

    // Si toutes les bières sont sélectionnées leur mettre la même taille
    if (selectedBrasserie == 'TOUTES') {
      svgScat.selectAll("circle")
             .attr("r", radius);

      // Déplace la carte pour apercevoir l'ensemble des brasseries
      map.flyToBounds(barMarkers.getBounds(), {duration: 0.8}); //TODO Est-ce que ça vaut la peine de zoomer sur l'ensemble des brasseries (monde entier)
    } else {
      // Faire "disparaître" les bières non correspondantes
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBrasserie !== d.Brasserie;})
             .transition()
             .duration(800)
             .attr("r", 0);
      // Remettre les bières correspondantes
      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBrasserie == d.Brasserie;})
             .transition()
             .duration(800)
             .attr("r", radius);
    }
    console.log("Brasserie choisie :" + selectedBrasserie);
    });

  ////////////////////
  // ECHELLES ET AXES

  // Définition du domain des échelles selon les données
  xScale.domain(d3.extent(binches, d => d.ABV));
  yScale.domain([0,d3.max(binches, d => d.IBU)]); // si on veut que IBU commence à 0, sinon utiliser extent
  barColorScale.domain(bars);

  // Ajout des axes du graphique
  let xAxis = svgScat.append("g")
                     .attr("class", "x axis")
                     .attr("transform", `translate(0, ${height})`)
                     .call(d3.axisBottom(xScale).tickPadding(5));

  let yAxis = svgScat.append("g")
                     .attr("class", "y axis")
                     .call(d3.axisLeft(yScale).tickPadding(5));

  ////////////////////
  // AJOUT CERCLES
  // Définition des attributs
  svgScat.append("g")
         .attr("class", "ensembleBinch")
         .selectAll("circle")
         .data(binches)
         .enter()
         .append("circle")
         .attr("class", "dot")
         .attr("r", radius)
         .attr("cx", d => xScale(d.ABV))
         .attr("cy", d => yScale(d.IBU))
         .style("fill", d => SrmColorScale(d.SRM))
         .style("stroke", "none")
         .style("opacity", 0.5);

  // Définition des interactions
  svgScat.selectAll(".dot")
         .data(binches)
         .on("mouseover", function(d) {
            // Affichage du tooltip
            toolTip.transition()
                   .duration(200)
                   .style("opacity", 0.9);
            // Remplissage du tooltip
            toolTip.html(`<b>${d.Biere}</b><br><i>Style : ${d.STYLE4}\
              <br>Amertume : ${d.IBU} IBU<br>Alcool : ${d.ABV} %\
              <br>Brasserie : ${d.Brasserie} <br> Bar : ${d.Bar}</i>`)
              .style("left", `${d3.event.pageX+20}px`)
              .style("top", `${d3.event.pageY+20}px`);
            // Mise en évidence de la bière
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", radius*2)
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
          .on("click",function(d){



            let spanBeer = d3.select("#selectedBeer")
                             .html(d.Biere);

            let spanABV = d3.select("#ABVselectedBeer")
                            .html("Alcool : " + d.ABV + " % | ");

            let spanBrass = d3.select("#BrassselectedBeer")
                              .html(d.Brasserie + "<br>");

            let spanIBU = d3.select("#IBUselectedBeer")
                            .html(d.IBU +" IBU | ");

            let spanStyle = d3.select("#SytleselectedBeer")
                              .html(d.STYLE4 + " | ");

            let spanBar = d3.select("#BarselectedBeer")
                            .html("On peut la trouver ici : " + d.Bar+"<br>");

            document.getElementById('Biereproches').innerHTML = '';

            d3.csv('rowdist.csv', function(error, data) {
              if (error) {
                console.log(error);
              } // Ajout des données
              data.forEach(function(d) {
                d.weight = +d.Weight;
              });

              // retourne les 10 bières les plus proches

              let filtered = data.filter(function (item) {
                return item.Source === d.Biere;
              });

              let rankdist = filtered.filter(function (item){
                return item.weight < 0.5;
              });

              rankdist.sort(function(a, b) { return a.weight - b.weight;});

              document.getElementById('Biereproches').innerHTML += "<h3>Bières similaires à "+d.Biere+" </h3><br>";

              for (let i = 0; i < 5; i++){
                if (i == 0) {
                  map.flyTo(new L.LatLng(d.Lat, d.Long), 12);
                }
                document.getElementById('Biereproches').innerHTML += ("<img src='"+beericon+"'>"+ "<b>" + rankdist[i].Target +"</b><br>");
              }
            });
          

                  // Faire "disparaître" les bières non correspondantes
            svgScat.selectAll("circle")
             .filter(function(d) {return biereUnique !== d.Biere;})
             .transition()
             .duration(3800)
             .attr("r", 0);
            // Remettre les bières correspondantes
            svgScat.selectAll("circle")
             .filter(function(d) {return biereUnique == d.Biere;})
             .transition()
             .duration(3800)
             .attr("r", radius);

          });

  //////////////
  // AJOUTS VISUS CARTES
  // Pour chaque brasserie, récupèrer les coordonnées et les assigner à un marqueur
  brasserieUnique.forEach(function(brass){
    let brasserie = binches.find(x => x.Brasserie === brass);

    let marker = new L.marker([brasserie.Lat, brasserie.Long], {icon: brassMarker})
        .bindTooltip(brasserie.Brasserie)
        .addTo(brassMarkers)
        .on("click", function (d){
          let selectedBrass = brasserie.Brasserie;
          svgScat.selectAll("circle")
                 .data(binches)
                 .filter(function(d) {return selectedBrass !== d.Brasserie;})
                 .transition()
                 .duration(800)
                 .attr("r",0);

          svgScat.selectAll("circle")
                 .data(binches)
                 .filter(function(d) {return selectedBrass == d.Brasserie;})
                 .transition()
                 .duration(800)
                 .attr("r",radius);

          console.log("Brasserie choisie :" + selectedBrass);
        });
  });
  // Ajout de la couche des marqueurs de brasserie à la carte
  map.addLayer(brassMarkers);
});

//////////////////////
// VISUS CARTES : BARS

// Import du fichier des bars et ajout à la carte
d3.json('bars.json', function(error, barsLsne) {
  if (error) { // Si le fichier n'est pas chargé, log de l'erreur
    console.log(error);
  }
  // Loop through the data
  for (let i = 0; i < barsLsne.length; i++) {
    let bar = barsLsne[i];
    // Create and save a reference to each marker
    markers[bar.Bar] = L.marker([bar.Lat, bar.Long], {
      icon: barMarker,
      riseOnHover: true
    }).bindTooltip(bar.Bar,  {className: 'barTooltip'})
      .addTo(barMarkers)
      .addTo(map);

    // Add the ID
    markers[bar.Bar]._icon.id = bar.Bar;

    // Add click event to markers
    $('.leaflet-marker-icon').on('click', function(e) {
      // Use the event to find the clicked element
      let el = $(e.srcElement || e.target),
          id = el.attr('id');

      // One way you could use the id
      map.flyTo(markers[id].getLatLng());

      let selectedBar = id;

      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBar !== d.Bar;})
             .transition()
             .duration(800)
             .attr("r",0);

      svgScat.selectAll("circle")
             .filter(function(d) {return selectedBar == d.Bar;})
             .transition()
             .duration(800)
             .attr("r",radius);

      console.log("Bar choisi :" + selectedBar + ", un bar magnifique");
    });
  }
  // for (let i = 0 ; i < barsLsne.length; i++) {
  //   let marker = new L.marker([barsLsne[i].Lat, barsLsne[i].Long], {icon: barMarker})
  //       .bindTooltip(barsLsne[i].Bar)
  //       .addTo(map); //.addTo(barMarkers); si cluster
  // }
  // map.addLayer(barMarkers); si cluster
});

//////////////////////
// AJOUTS LEGENDE AXES GRAPHIQUE : BARS
svgScat.append("text")
       .attr("class", "x label")
       .attr("text-anchor", "end")
       .attr("x", width-5)
       .attr("y", height-7)
       .text("Alcool par volume (%)");

svgScat.append("text")
       .attr("class", "y label")
       .attr("text-anchor", "end")
       .attr("x", -7)
       .attr("y", 5)
       .attr("dy", ".75em")
       .attr("transform", "rotate(-90)")
       .text("Amertume (IBU)");
