library("jsonlite")
library("cluster")

K <- 5 # voisins conservés par bière (le site en affiche 5)
SEUIL <- 0.5 # au-delà, une bière n'est plus jugée similaire

# Données
binches <- fromJSON("data/binches.json")
bars <- fromJSON("data/bars.json")

# Ajout des villes pour faire la correspondance par ville
binches$Ville <- bars$Ville[match(binches$Bar, bars$Bar)]

# Combinaisons correspondant aux bières uniques
uniques <- unique(binches[, c(
  "Biere",
  "ABV",
  "SRM",
  "STYLE1",
  "STYLE2",
  "STYLE3",
  "STYLE4",
  "IBU"
)])

# Factoriser les styles
cols_styles <- paste0("STYLE", 1:4)
uniques[cols_styles] <- lapply(uniques[cols_styles], factor)

# Calculer les distances
D <- as.matrix(daisy(uniques[, -1], metric = "gower"))
dimnames(D) <- list(uniques$Biere, uniques$Biere)
# Enlever les 0 pour éviter les auto-correspondances
diag(D) <- Inf


proches_par_ville <- function(noms, ville) {
  # Trier sur les bières disponibles
  sub_D <- D[noms, noms, drop = FALSE]
  # Pour chaque source, prendre les K plus proches voisins (inférieurs au seuil)
  res <- lapply(noms, function(src) {
    d <- head(sort(sub_D[src, ]), K + 1)
    d <- head(d[d < SEUIL], K)
    if (length(d) == 0) {
      return(NULL)
    }
    data.frame(
      Ville = ville,
      Source = src,
      Target = names(d),
      Weight = round(unname(d), 3)
    )
  })
  do.call(rbind, res)
}

bieres_villes <- c(
  list(TOUTES = uniques$Biere),
  lapply(split(binches$Biere, binches$Ville), unique)
)

bieres_similaires_villes <- do.call(
  rbind,
  lapply(names(bieres_villes), function(v) {
    proches_par_ville(bieres_villes[[v]], v)
  })
)

write.csv(
  bieres_similaires_villes,
  file = "data/rowdist.csv",
  row.names = FALSE
)
