# dataBinch
Projet de Visualisation de données UNIL

Visualisations de divers aspects des bières trouvées dans une sélection de bar lausannois

Accessible à l'adresse suivante : https://databinch.github.io./


## Données

Les bières représentées sont celles qui *ont été* disponibles dans les bars choisis.
Elles ne sont ainsi pas forcément représentatives de l'état actuel des cartes.

Si les données concernant le taux d'alcool ou le style de bière sont aisément accessibles à tout un chacun, la couleur (SRM/EBC) et l'amertume (IBU/EBU) ont subi une étape préalable de recherche intensive, mais pas toujours fructueuse. Dans ce dernier cas, une interpolation depuis le style de bière ou les "clones" pour le brassage amateur est effectuée. En dernier recours, les auteurs ont du recourir à l'expérimentation directe via la consommation.

## Distances et _recommender system_

Le principe d'un recommender system est de proposer à partir d'un produit source, une liste de produits proches basés sur une certaine similarité.
Nous avons appliqué ce principe aux bières de notre base de données et calculé une matrice de dissimilarité à partir des informations suivantes :
- Alcool
- Amertume
- Couleur
- Style, selon une classification ascendante hiérarchique que nous avons rapporté sur des attributs successifs de catégories de plus en plus fines

Le calcul de la dissimilarité prenant en compte des données catégorielles, nous avons eu recours à la distance de Gower qui permet de prendre en compte à la fois des données numériques et des données catégorielles.

La distance étant une dissimilarité, nous trions les distances par ordre croissant de façon à retourner les valeurs de distance les plus faibles afin d'obtenir les bières les plus proches de la bière sélectionnée.
