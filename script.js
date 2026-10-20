import { creerCarte } from './carte.js';

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
    plugins: { clear_button: { title: 'Effacer' } },
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

// Liste des bars dans l'infobulle
function libelleBars(bars) {
  const libelle = bars.length > 3
    ? `${bars.slice(0, 3).join(', ')} et ${bars.length - 3} autres`
    : bars.join(', ');
  return `${bars.length > 1 ? 'Bars' : 'Bar'} : ${libelle}`;
}

// Petit texte gris « brassée par » / « disponible chez »
function legende(texte) {
  const i = document.createElement('i');
  i.className = 'legende-info';
  i.textContent = texte;
  return i;
}


// Dimensions de l'espace utile d'un élément (sans ses marges intérieures)
function largeurUtile(el) {
  const s = getComputedStyle(el);
  return el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
}

function binchesVilleSelected(villechoisie, bars, binches, distances) {

  const toutes = villechoisie === 'TOUTES';
  const barsVilleChoisie = toutes
    ? bars.map(b => b.Bar)
    : bars.filter(b => b.Ville === villechoisie).map(b => b.Bar);
  const binchesVilleChoisie = toutes
    ? binches
    : binches.filter(b => barsVilleChoisie.includes(b.Bar));
  const binchesVilleChoisieavecCOO = toutes
    ? bars
    : bars.filter(b => barsVilleChoisie.includes(b.Bar));


  ////////////////////////////////
  // DEFINITION VARIABLES GLOBALES ET CONSTANTES
  ////////////////////////////////

  // Définitions des éléments relatifs au scatteplot
  const margins = {
    "left": 35,
    "right": 35,
    "top": 30,
    "bottom": 30
  };

  let svgScat = d3.select("#scatter-load").append("svg").attr("id", "scatterplot");

  let graphWidth, graphHeight;

  const toolTip = d3.select("body")
    .append("div")
    .attr("class", "infobulle")
    .style("opacity", 0);

  // Nombre de bières similaires à retourner
  const limiteSimi = 5;

  // Import de la "matrice" des distances
  const rowDistFilter = distances.filter(d => d.Ville === villechoisie);

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

  /////////////////////////
  // Création de la carte
  const carte = creerCarte('map', villechoisie);


  ////////////////////////////////////////////////
  // AFFICHAGE VISUALISATION ET IMPORT DONNEES
  ////////////////////////////////////////////////

  // Si la largeur de la fenêtre change, le graphique est redessiné, une seule fois quand le
  // redimensionnement s'arrête. Quand la barre d'adresse d'un mobile se masque, seule la
  // hauteur change : on ne redessine pas dans ce cas.
  let largeurPrecedente = window.innerWidth;
  let minuteur;
  window.addEventListener("resize", function() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function() {
      if (window.innerWidth === largeurPrecedente) return;
      largeurPrecedente = window.innerWidth;
      drawSvg(true);
    }, 150);
  });

  // Dict par nom et array des bières par bar
  const biereParNom = new Map(binches.map(b => [String(b.Biere), b]));
  const biereBar = binchesVilleChoisie.map(n => ({ biere: n.Biere, bar: n.Bar }));
  // Garder un point par bière avec la liste des bars
  const pointsBieres = [...d3.group(binchesVilleChoisie, d => String(d.Biere))]
    .map(([nom, lignes]) => ({ ...lignes[0], Biere: nom, bars: lignes.map(l => l.Bar) }));

  // Listes de valeurs
  const barsUniques = [...new Set(binchesVilleChoisie.map(d => d.Bar))].sort();
  const brasseriesUniques = [...new Set(binchesVilleChoisie.map(d => d.Brasserie))].sort();
  const bieresUniques = [...new Set(binchesVilleChoisie.map(d => d.Biere))].sort();
  const stylesUniques = [...new Set(binchesVilleChoisie.map(d => d.STYLE4))].sort();

  // Création des sélecteurs
  const tomBar = creerSelecteur('filterbar', 'bar-list', 'Un bar en particulier ?', 'TOUS', barsUniques, function() {
    if (!this.value) return reinitialiser();
    const selectedBar = this.value;
    pickCircles(selectedBar, "Bar");
    updateInfos(selectedBar);
    updateAllSelects(selectedBar, "bar-list");
    goToMarker(selectedBar, 'bar');
  });

  const tomBrass = creerSelecteur('filterbrass', 'brass-list', 'Une brasserie à découvrir ?', 'TOUTES', brasseriesUniques, function() {
    if (!this.value) return reinitialiser();
    const selectedBrasserie = this.value;
    pickCircles(selectedBrasserie, "Brasserie");
    updateInfos(selectedBrasserie);
    updateAllSelects(selectedBrasserie, "brass-list");
    goToMarker(selectedBrasserie, 'brasserie');
  });

  const tomBinch = creerSelecteur('filterbinch', 'binch-list', 'Une bière intéressante ?', 'TOUTES', bieresUniques, function() {
    if (!this.value) return reinitialiser();
    selectionnerBiere(this.value);
  });

  const tomStyle = creerSelecteur('filterstyle', 'style-list', 'Un style de bière favori ?', 'TOUS', stylesUniques, function() {
    if (!this.value) return reinitialiser();
    const selectedStyle = this.value;
    pickCircles(selectedStyle, "STYLE4");
    updateInfos(selectedStyle);
    updateAllSelects(selectedStyle, "style-list");
  });

  const selecteurs = { 'bar-list': tomBar, 'brass-list': tomBrass, 'binch-list': tomBinch, 'style-list': tomStyle };

  carte.ajouterBars(binchesVilleChoisieavecCOO, (nom) => {
    updateInfos(nom);
    updateAllSelects(nom, 'bar-list');
    carte.allerAuBar(nom);
    pickCircles(nom, 'Bar');
  });

  const brasseries = [...new Map(binchesVilleChoisie.map(b => [b.Brasserie, b])).values()];
  carte.ajouterBrasseries(brasseries, (nom) => {
    updateInfos(nom);
    updateAllSelects(nom, 'brass-list');
    carte.allerALaBrasserie(nom);
    pickCircles(nom, 'Brasserie');
  });

  // Fonction qui dessine le svg et fait l'interaction avec la carte
  // prend un booleen indiquant si c'est redessiné (par ex. ajustement de la taille)

  function drawSvg(redraw) {
    // Enlever le scatterplot précédent
    document.getElementById('scatterplot')?.remove();

    // Récupère les valeurs des sélecteurs
    let valBar = tomBar.getValue();
    let valBrass = tomBrass.getValue();
    let valBinch = tomBinch.getValue();

    // Ajuste de façon standard la taille
    const largeur = largeurUtile(document.getElementById('colonne-graphique'));
    // Rapport 4:3, sans dépasser 70 % de la hauteur de la fenêtre, avec un minimum lisible
    const hauteur = Math.max(280, Math.min(largeur * 0.75, window.innerHeight * 0.7));
    graphWidth = largeur - margins.left - margins.right;
    graphHeight = hauteur - margins.top - margins.bottom;

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

      ////////////////////
      // ECHELLES ET AXES

      // Définition du domain des échelles selon les données
      xScale.domain(d3.extent(pointsBieres, d => d.ABV));
      yScale.domain([0, d3.max(pointsBieres, d => d.IBU)]); // si on veut que IBU commence à 0, sinon utiliser extent
      // barColorScale.domain(barsUniques);

      // Ajout des axes du graphique
      svgScat.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${graphHeight})`)
        .call(d3.axisBottom(xScale).tickPadding(5));

      svgScat.append("g")
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
        .data(pointsBieres)
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
        .data(pointsBieres)
        .on("mouseover", function(event, d) {

          // Remplissage du tooltip
          toolTip.html(`<b>${d.Biere}</b><br><i>Style : ${d.STYLE4}\
                        <br>Amertume : ${d.IBU} IBU<br>Alcool : ${d.ABV} %\
                        <br>Brasserie : ${d.Brasserie} <br> ${libelleBars(d.bars)}</i>`)
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
        .on("mouseout", function() {
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
            .filter(d => d.bars.includes(valBar))
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

    goToMarker(selectedBrass, 'brasserie');

    // Màj des informations et sélecteurs
    updateInfos(selectedBrass);
    updateAllSelects(selectedBrass, "brass-list");

  });

  // Rend les bars où la bière est disponible interactifs
  document.getElementById('BarSelectedBeer').addEventListener("click", function(e) {
    if (e.target !== e.currentTarget) {
      const selectedBar = e.target.textContent.replace(/ \| $/, '');

      pickCircles(selectedBar, "Bar");

      goToMarker(selectedBar, 'bar');

      // Màj des informations et sélecteurs
      updateInfos(selectedBar);
      updateAllSelects(selectedBar, "bar-list");
    }
    e.stopPropagation();
  });

  // Sélecteur vidé par l'utilisateur : retour à l'état initial, sans erreur
  function reinitialiser() {
    updateInfos('TOUTES');
    updateAllSelects('TOUTES');
  }

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
    for (const e of document.querySelectorAll('.infoSelected')) e.replaceChildren();
    document.getElementById('Biereproches').replaceChildren();
    const ecrire = (id, ...contenu) => document.getElementById(id).replaceChildren(...contenu);

    if (selected == 'TOUTES' || selected == 'TOUS') {
      ecrire('selectedBeer');
    } else if (listeBiere) {
      const binch = listeBiere.find(d => String(d.Biere) === selected);
      ecrire('BrassSelectedBeer', `${binch.Brasserie} `, document.createElement('br'));
      ecrire('selectedBeer', `${binch.Biere} \u2002 `, legende(' brassée par '), ' \u2002');
      ecrire('ABVselectedBeer', `Alcool : ${binch.ABV} % | `);
      ecrire('IBUselectedBeer', `${binch.IBU} IBU \u2002 `, legende(' disponible chez '), ' \u2002');
      ecrire('StyleSelectedBeer', `${binch.STYLE4} | `);
      const conteneur = document.getElementById('BarSelectedBeer');
      const bars = listeBar.filter(l => l.biere == selected).map(l => l.bar);
      bars.forEach((bar, i) => {
        if (i > 0) conteneur.append(' | ');
        const span = document.createElement('span');
        span.className = 'barDispo';
        span.textContent = bar;
        conteneur.append(span);
      });
    } else {
      ecrire('selectedBeer', selected);   // texte brut : « & » reste « & »
    }
  }

  // Déplace la carte sur le marker, ouvre son tooltip et le met en avant
  function goToMarker(selected, type, listeBiere) {
    if (selected == 'TOUS' || selected == 'TOUTES') return carte.toutVoir();
    if (listeBiere) selected = biereParNom.get(String(selected)).Brasserie;
    if (type === 'bar') carte.allerAuBar(selected);
    else carte.allerALaBrasserie(selected);
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
    goToMarker(nom, 'brasserie', binchesVilleChoisie);
    afficherSimilaires(nom);
  }

  // Détermine quels cercles sont à conserver sur le graphique
  function pickCircles(selected, champ, t = 400) {
    // Un bar est une liste dans chaque point ; les autres champs sont des valeurs simples
    const correspond = champ === 'Bar'
      ? d => d.bars.includes(selected)
      : d => String(d[champ]) === selected;
    
    svgScat.selectAll('circle')
      .transition()
      .duration(t)
      .attr("r", 0)
      .filter(correspond)
      .transition()
      .duration(t)
      .attr("r", radius);
  }

}

// Permet d'ajuster le logo en fonction du SRM
function adjustLogo(srmBinche) {
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
