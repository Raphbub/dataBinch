// Définition du sélecteur de bars
let dropDown = d3.select('#filter')
                 .append("select")
                //  .attr("class", "form-control") --> pour bootstrap
                 .attr("name", "bar-list");

// Définitions des éléments relatifs au scatteplot
let margins = {
  "left": 40,
  "right": 30,
  "top": 30,
  "bottom": 30
};

let width = 1000 - margins.left - margins.right;
let height = 600 - margins.top - margins.bottom;

let svgScat = d3.select("#scatter-load")
                .append("svg")
                .attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom)
                .append("g")
                .attr("transform", `translate(${margins.left},${margins.top})`);

let toolTip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

// Définitions des différentes échelles
let radius = 4;

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

// Import des données et affichage des visus
d3.json('binches.json', function(error, binches) {
  if (error) { // Si le fichier n'est pas chargé, log de l'erreur
    console.log(error);
  }

  // Récupération des différents bars
  let bars = [...new Set(binches.map(item => item.Bar))];

  // Assignement des bars au sélecteur
  let optDrop = dropDown.selectAll("option")
                        .data(["TOUS"].concat(bars))
                        .enter()
                        .append("option");

  optDrop.text(d => d)
         .attr("value", d => d);
  // Si on sélectionne un bar, cache les autres
  dropDown.on("change", function(binches) {
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
                  .style("opacity", .9);

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
