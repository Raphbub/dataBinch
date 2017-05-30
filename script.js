/*jshint esnext: true */

// TODO

// interaction entre les sélecteurs -> sinon remise à zéro des autres quand un est sélectionné

// optimisation graphique de l'affichage du recommender system

// affichage du recommender system lors du choix de la biere via le selecteur de biere



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

// Couleurs selon le ,SRM/EBC
let SrmColorScale = d3.scaleLinear()
                   .domain([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,50])
                   .range(["#FFE699","#FFD878","#FFCA5A","#FFBF42","#FBB123","#F8A600","#F39C00","#EA8F00","#E58500","#DE7C00","#D77200","#CF6900","#CB6200",
                          "#C35900","#BB5100","#B54C00","#B04500","#A63E00","#A13700","#9B3200","#952D00","#8E2900","#882300","#821E00","#7B1A00","#771900",
                          "#701400","#6A0E00","#660D00","#5E0B00","#5A0A02","#600903","#520907","#4C0505","#470606","#440607","#3F0708","#3B0607","#3A070B", "#36080A","black"]);

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
              let selectedBar = this.value;

              if (selectedBar == 'TOUS') {
                svgScat.selectAll("circle")
                        .attr("r", radius);
              } else {
                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBar !== d.Bar;})
                       .attr("r", 0);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBar == d.Bar;})
                       .attr("r", radius);
              }
                console.log("Bar choisi :" + $('select#bar-list.selectpicker').val() + ", un bar magnifique");
                map.setView(markers[$('select#bar-list.selectpicker').val()].getLatLng(), 18);

  });


  let optDropBinch = dropDownBinch.selectAll("option")
                        .data(["TOUTES"].concat(biereUnique))
                        .enter()
                        .append("option");

  optDropBinch.text(d => d)
         .attr("value", d => d);


  // Si on sélectionne une bière, cache les autres à voir ce qu'on fait de ça (disparaître ou mettre en valeur)


  dropDownBinch.on("change", function(binches) {
              let selectedBinch = this.value;

              if (selectedBinch == 'TOUTES') {
                svgScat.selectAll("circle")
                      .attr("r", radius);
              } else {

// à éventuellement modifier pour mise en valeur au lieu de la disparition

                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBinch !== d.Biere;})
                       .attr("r", 0);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBinch == d.Biere;})
                       .attr("r", radius);

                       console.log("Bière choisie :" + selectedBinch + ", très bon choix !");
              }
});


    let optDropBrass = dropDownBrass.selectAll("option")
                        .data(["TOUTES"].concat(brasserieUnique))
                        .enter()
                        .append("option");

  optDropBrass.text(d => d)
         .attr("value", d => d);


  // Si on sélectionne une bière, cache les autres à voir ce qu'on fait de ça (disparaître ou mettre en valeur)


  dropDownBrass.on("change", function() {
              let selectedBrasserie = this.value;

              if (selectedBrasserie == 'TOUTES') {
                svgScat.selectAll("circle")
                          .attr("r", radius);
              } else {

// à éventuellement modifier pour mise en valeur au lieu de la disparition

                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBrasserie !== d.Brasserie;})
                       .attr("r", 0);

                svgScat.selectAll("circle")
                       .filter(function(d) {return selectedBrasserie == d.Brasserie;})
                       .attr("r", radius);
              }
              console.log("Brasserie choisie :" + selectedBrasserie);


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
              <br>Brasserie : ${d.Brasserie} <br> Bar : ${d.Bar}</i>`)
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
                .html("La bière sélectionnée est : <b>"+ d.Biere+"</b>,<br>");

            var spanABV = d3.select("#ABVselectedBeer")
                .html("Son taux d'alcool est de " + d.ABV + " %"+" alors que la médiane est à 6.5 %, <br>");

            var spanBrass = d3.select("#BrassselectedBeer")
                    .html(" brassée par " + d.Brasserie + ",<br>");

            var spanIBU = d3.select("#IBUselectedBeer")
                    .html("Son amertume est mesurée à " + d.IBU +" IBU"+" alors que la médiane est à 32 IBU,<br>");

            var spanStyle = d3.select("#SytleselectedBeer")
                .html("C'est une bière de type "+ d.STYLE4);

            var spanBar = d3.select("#BarselectedBeer")
                    .html("On peut la trouver ici : " + d.Bar+"<br>");

            document.getElementById('Biereproches').innerHTML="";

                    d3.csv('rowdist.csv', function(data) {

                            data.forEach(function(d) {
                            d.weight = +d.Weight;

                          });

      // retourne les 10 bières les plus proches

                          var filtered = data.filter(function (item) {
                              return item.Source === d.Biere;
                          });

                          var rankdist = filtered.filter(function (item){
                            return item.weight < 0.5;
                          });
                          rankdist.sort(function(a, b) { return a.weight - b.weight;});


                          for (var current = 0; current < 10; current++){

                          document.getElementById('Biereproches').innerHTML += ("Bière proche de <b>"+d.Biere +"</b> #" + current + ": <b>" + rankdist[current].Target +"</b><br>");
                          console.log("Bière proche de "+d.Biere +" #", current, ": ", rankdist[current].Target);
                          }

                    });

                    map.setView(new L.LatLng(d.Lat, d.Long), 12);
          });

  //////////////////////////// Parties cartes
  // Pour chaque brasserie, récupèrer les coordonnées et les assigner au pop-up + nom
  brasserieUnique.forEach(function(brass){
    let brasserie = binches.find(x => x.Brasserie === brass);

    let marker = new L.marker([brasserie.Lat, brasserie.Long], {icon: brassMarker})
        .bindPopup(brasserie.Brasserie)
        .addTo(brassMarkers)
        .on("click", function (d){
          let selectedBrass = brasserie.Brasserie;
            svgScat.selectAll("circle")
                   .data(binches)
                   .filter(function(d) {return selectedBrass !== d.Brasserie;})
                   .attr("r",0);

            svgScat.selectAll("circle")
                   .data(binches)
                   .filter(function(d) {return selectedBrass == d.Brasserie;})
                   .attr("r",radius);

            console.log("Brasserie choisie :" + selectedBrass);

        });
      //  console.log(brasserie.Brasserie);


  });


  // Ajout des marqueurs à la carte
  map.addLayer(brassMarkers);


});


  // Import du fichier des bars et ajout à la carte
  d3.json('bars.json', function(error, barsLsne) {
    if (error) { // Si le fichier n'est pas chargé, log de l'erreur
      console.log(error);
    }



  // Loop through the data
  for (var i = 0; i < barsLsne.length; i++) {
    var person = barsLsne[i];
  //  console.log(person.Lat);
    // Create and save a reference to each marker
    markers[person.Bar] = L.marker([person.Lat, person.Long], {
    })
    .bindPopup(person.Bar)
    .addTo(map);

    // Add the ID
    markers[person.Bar]._icon.id = person.Bar;


//  console.log(markers);

  // Add click event to markers
  $('.leaflet-marker-icon').on('click', function(e) {
     // Use the event to find the clicked element
     var el = $(e.srcElement || e.target),
         id = el.attr('id');

      // One way you could use the id
      map.panTo(markers[id].getLatLng() );

      let selectedBar = id;

        svgScat.selectAll("circle")
               .filter(function(d) {return selectedBar !== d.Bar;})
               .attr("r",0);

        svgScat.selectAll("circle")
               .filter(function(d) {return selectedBar == d.Bar;})
               .attr("r",radius);

        console.log("Bar choisi :" + selectedBar + ", un bar magnifique");

  });
  }

    // for (let i = 0 ; i < barsLsne.length; i++) {
    //   let marker = new L.marker([barsLsne[i].Lat, barsLsne[i].Long], {icon: barMarker})
    //       .bindPopup(barsLsne[i].Bar)
    //       .addTo(map); //.addTo(barMarkers); si cluster
    // }




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
