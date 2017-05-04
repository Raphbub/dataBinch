/*jshint esnext: true */


// Définition du sélecteur de bars
let dropDownBar = d3.select('#filterbar')
                 .append("select")
                 .attr("id", "bar-list")
                 .attr("class","selectpicker")
                 .attr("title", "Un bar en particulier ?");


// Définition du sélecteur de bieres

let dropDownBinch = d3.select('#filterbinch')
                 .append("select")
                 .attr("id", "binch-list")
                 .attr("class","selectpicker")
                 .attr("data-live-search","true")
                 .attr("title", "Tapez pour rechercher");

let dropDownBrass = d3.select('#filterbrass')
                 .append("select")
                 .attr("id", "brass-list")
                 .attr("class","selectpicker")
                 .attr("data-live-search","true")
                 .attr("title", "Tapez pour rechercher");


// Définitions des éléments relatifs au scatteplot
let margins = {
  "left": 40,
  "right": 30,
  "top": 30,
  "bottom": 30
};

let width = $('.2r2c').width() - margins.left - margins.right;
let height = $('.2emeRang').height() - margins.top - margins.bottom;

let svgScat = d3.select("#scatter-load")
                .append("svg")
                .attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom)
                .append("g")
                .attr("transform", `translate(${margins.left},${margins.top})`);

let toolTip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

                // Add a place to save markers

                var markers = {};
var marker;
// Définitions des différentes échelles
let radius = 6.5;

// Axiales
let xScale = d3.scaleLinear()
               .range([0, width])
               .nice();

let yScale = d3.scaleLinear()
               .range([height, 0])
               .nice();

// Couleurs selon le SRM/EBC
let SrmColorScale = d3.scaleLinear()
                   .domain([1, 7, 10, 20, 35])
                   // TODO affiner les couleurs
                   .range(["#FFE699","gold","#FE9A2E","brown","#610B0B"]);

// Couleurs selon le bar
let barColorScale = d3.scaleOrdinal(d3.schemeCategory20);

/////////////////////////////////////////////////////////
// Parties relatives à la carte
//Définition des couches de base de la carte
let cartodbLayer =  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',{
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}); // Fond simple clair

let stamenLayer =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  ext: 'png'
}); // Fond terrain

// Définition de la carte
let map = L.map('map', {
  center: [46.52, 6.62],
  zoom: 6
});

// Ajout des couches à la carte
map.addLayer(cartodbLayer, stamenLayer);

// Attribution des couches de bases pour le sélecteur
var baseMaps = {
    "Simple": cartodbLayer,
    "Terrain": stamenLayer
};
// Ajout des noms au sélecteur
L.control.layers(baseMaps).addTo(map);

L.control.scale({
  imperial: false
}).addTo(map);

// Ajout du bouton et fonction de localisation
L.control.locate().addTo(map);

// Définition des marqueurs des brasseries
let brassMarker = L.AwesomeMarkers.icon({
    icon: 'industry',
    prefix: 'fa',
    markerColor: 'white',
    iconColor: 'black'
});
// Définition des marqueurs des bars
let barMarker = L.AwesomeMarkers.icon({
    icon: 'beer',
    prefix: 'fa',
    markerColor: 'blue',
    iconColor: 'white'
});

// Rassemblement des marqueurs en clusters
let brassMarkers = L.markerClusterGroup({
  showCoverageOnHover: false, //Ne pas montrer les limites
  disableClusteringAtZoom: 12,
  spiderfyOnMaxZoom: false
});
// A voir si on veut cluster les bars... TODO
// let barMarkers = L.markerClusterGroup({
//   showCoverageOnHover: false, //Ne pas montrer les limites
// });

////////////////////////////////////
// Import des données et affichage des visus
d3.json('binches.json', function(error, binches) {
  if (error) { // Si le fichier n'est pas chargé, log de l'erreur
    console.log(error);
  }

  // Récupération des différents bars
  let bars = [...new Set(binches.map(item => item.Bar))];
  let biereUnique = [...new Set(binches.map(item => item.Biere))];
  let brasserieUnique = [...new Set(binches.map(item => item.Brasserie))];

  // Assignement des bars au sélecteur
  let optDropBar = dropDownBar.selectAll("option")
                        .data(["TOUS"].concat(bars))
                        .enter()
                        .append("option");

  optDropBar.text(d => d)
         .attr("value", d => d);


  // Si on sélectionne un bar, cache les autres
  dropDownBar.on("change", function(binches) {
              let selected = this.value;
              display = this.checked ? "none" : "inline";
              displayOthers = this.checked ? "inline" : "none";

              if (selected == 'TOUS') {
                svgScat.selectAll("circle")
                       .attr("display", display);
              } else {
                svgScat.selectAll("circle")
                       .filter(function(d) {return selected !== d.Bar;})
                       .attr("display", displayOthers);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selected == d.Bar;})
                       .attr("display", display);
              }
                console.log("Bar choisi :" + $('select#bar-list.selectpicker').val() + ", un bar magnifique");
                map.setZoom(17);

                map.panTo( markers[$('select#bar-list.selectpicker').val()].getLatLng());

  });


  let optDropBinch = dropDownBinch.selectAll("option")
                        .data(["TOUTES"].concat(biereUnique))
                        .enter()
                        .append("option");

  optDropBinch.text(d => d)
         .attr("value", d => d);


  // Si on sélectionne une bière, cache les autres à voir ce qu'on fait de ça (disparaître ou mettre en valeur)


  dropDownBinch.on("change", function(binches) {
              let selected = this.value;
              display = this.checked ? "none" : "inline";
              displayOthers = this.checked ? "inline" : "none";

              if (selected == 'TOUTES') {
                svgScat.selectAll("circle")
                       .attr("display", display);
              } else {

// à éventuellement modifier pour mise en valeur au lieu de la disparition

                svgScat.selectAll("circle")
                       .filter(function(d) {return selected !== d.Biere;})
                       .attr("display", displayOthers);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selected == d.Biere;})
                       .attr("display", display);
              }
              console.log("Bière choisie :" + $('select#binch-list.selectpicker').val() + ", très bon choix !");

                var spanBeer = d3.select("#selectedBeer")
                    .html("La bière sélectionnées est : "+ d.Biere+",<br>");

                var spanABV = d3.select("#ABVselectedBeer")
                    .html("Son taux d'alcool est de " + d.ABV + " %"+" alors que la médiane est à 6.5 %,<br>");

                var spanIBU = d3.select("#IBUselectedBeer")
                        .html("Son amertume est mesurée à " + d.IBU +" IBU"+" alors que la médiane est à 32 IBU,<br>");

                var spanStyle = d3.select("#SytleselectedBeer")
                    .html("C'est une bière de type "+ d.STYLE4+",<br>");

                var spanBar = d3.select("#BarselectedBeer")
                        .html("On peut la trouver ici : " + d.Bar);


});


    let optDropBrass = dropDownBrass.selectAll("option")
                        .data(["TOUTES"].concat(brasserieUnique))
                        .enter()
                        .append("option");

  optDropBrass.text(d => d)
         .attr("value", d => d);


  // Si on sélectionne une bière, cache les autres à voir ce qu'on fait de ça (disparaître ou mettre en valeur)


  dropDownBrass.on("change", function(binches) {
              let selected = this.value;
              display = this.checked ? "none" : "inline";
              displayOthers = this.checked ? "inline" : "none";

              if (selected == 'TOUTES') {
                svgScat.selectAll("circle")
                       .attr("display", display);
              } else {

// à éventuellement modifier pour mise en valeur au lieu de la disparition

                svgScat.selectAll("circle")
                       .filter(function(d) {return selected !== d.Brasserie;})
                       .attr("display", displayOthers);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selected == d.Brasserie;})
                       .attr("display", display);
              }
              console.log("Brasserie choisie :" + $('select#brass-list.selectpicker').val()+", un travail incomparable pour des bières (pas toujours) de qualité");

});



// Définition du domain des échelles selon les données
  xScale.domain(d3.extent(binches, d => d.ABV));
  yScale.domain([0,d3.max(binches, d => d.IBU)]); // TODO si on veut que IBU commence à 0, sinon utiliser extent
  barColorScale.domain(bars);

// Ajout des axes du graphique
  svgScat.append("g")
         .attr("class", "x axis")
         .attr("transform", `translate(0, ${height})`)
         .call(d3.axisBottom(xScale).tickPadding(5));

  svgScat.append("g")
         .attr("class", "y axis")
         .call(d3.axisLeft(yScale).tickPadding(5));

// Ajout des cercles (bières)
  // Définition des attributs
  svgScat.append("g")
         .attr("class", "dotGroup")
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
            toolTip.transition()
                  .duration(200)
                  .style("opacity", 0.9);

            toolTip.html(`<b>${d.Biere}</b><br><i>Style : ${d.STYLE4}\
              <br>Amertume : ${d.IBU} IBU<br>Alcool : ${d.ABV} %\
              <br>Brasserie : ${d.Brasserie}</i>`)
              .style("left", `${d3.event.pageX+20}px`)
              .style("top", `${d3.event.pageY+20}px`);

            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 10)
              .style("opacity", 1);
         })
         .on("mouseout", function(d) {
            toolTip.transition()
                  .duration(200)
                  .style("opacity", 0);

            d3.select(this)
              .transition()
              .duration(300)
              .attr("r", radius)
              .style("opacity", 0.5);
          })
          .on("click",function(d){
            var spanBeer = d3.select("#selectedBeer")
                .html("La bière sélectionnées est : <b>"+ d.Biere+"</b>,<br>");

            var spanABV = d3.select("#ABVselectedBeer")
                .html("Son taux d'alcool est de " + d.ABV + " %"+" alors que la médiane est à 6.5 %,<br>");

            var spanIBU = d3.select("#IBUselectedBeer")
                    .html("Son amertume est mesurée à " + d.IBU +" IBU"+" alors que la médiane est à 32 IBU,<br>");

            var spanStyle = d3.select("#SytleselectedBeer")
                .html("C'est une bière de type "+ d.STYLE4+",<br>");

            var spanBar = d3.select("#BarselectedBeer")
                    .html("On peut la trouver ici : " + d.Bar);

          });

  //////////////////////////// Parties cartes
  // Pour chaque brasserie, récupèrer les coordonnées et les assigner au pop-up + nom
  brasserieUnique.forEach(function(brass){
    let brasserie = binches.find(x => x.Brasserie === brass);

    let marker = new L.marker([brasserie.Lat, brasserie.Long], {icon: brassMarker})
        .bindPopup(brasserie.Brasserie)
        .addTo(brassMarkers);

        console.log(brasserie.Brasserie);

  });


  // Ajout des marqueurs à la carte
  map.addLayer(brassMarkers);



  // Import du fichier des bars et ajout à la carte
  d3.json('bars.json', function(error, barsLsne) {
    if (error) { // Si le fichier n'est pas chargé, log de l'erreur
      console.log(error);
    }



  // Loop through the data
  for (var i = 0; i < barsLsne.length; i++) {
    var person = barsLsne[i];
    console.log(person.Lat);
    // Create and save a reference to each marker
    markers[person.Bar] = L.marker([person.Lat, person.Long], {
    })
    .bindPopup(person.Bar)
    .addTo(map);

    // Add the ID
    markers[person.Bar]._icon.id = person.Bar;
  }

  console.log(markers);
  // Add click event to markers
  $('.leaflet-marker-icon').on('click', function(e) {
     // Use the event to find the clicked element
     var el = $(e.srcElement || e.target),
         id = el.attr('id');

      alert('Here is the markers ID: ' + id + '. Use it as you wish. Hit ok and watch the map.');

      // One way you could use the id
      map.panTo( markers[id].getLatLng() );
  });


    // for (let i = 0 ; i < barsLsne.length; i++) {
    //   let marker = new L.marker([barsLsne[i].Lat, barsLsne[i].Long], {icon: barMarker})
    //       .bindPopup(barsLsne[i].Bar)
    //       .addTo(map); //.addTo(barMarkers); si cluster
    // }


  });

  // map.addLayer(barMarkers); si cluster

});

// Légendes des axes
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


d3.csv('rowdist.csv', function(d) {


  return {
    source : d.Source,
    target : d.Target,
    weight : +d.Weight,
  };
},
  function(data){

        console.log("data[1]:", data[1]);

        distances = d3.nest()
                    .key(function(data) { return data.source; })
                    .key(function(data) { return data.weight; })
                    .map(data);
    console.log("distances:", distances);


});
