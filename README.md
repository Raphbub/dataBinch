# **dataBinch**
#### Statistiques et visualisations d'une large sélection de bières de bars lausannois

Disponible en ligne : https://databinch.github.io &emsp; *Sortie de la version 1.0, ~~Champagne !~~*
___

Envie d'une bonne ale?

À la recherche de bières similaires à votre préférée ?

En savoir plus sur la mousse dégustée hier en terrasse ?

[**dataBinch**](https://databinch.github.io) est la solution à ces questions et à bien d'autres encore ! Notre site interactif répertorie plus de 650 bières qui sont ou ont été disponibles à la carte de 20 bars lausannois.

Amertume, couleur, taux d'alcool, style ou brasserie, bientôt les bières n'auront plus de secret pour vous. Grâce à nos fonctions de recherche, en sélectionnant une mousse, vous obtenez également celles qui s'en rapprochent le plus. Ainsi, une fois votre style préféré découvert, partez à la découverte des breuvages similaires proposés par [**dataBinch**](https://databinch.github.io).

Découverte aisée, car, pour chaque bière, vous pouvez savoir quels sont les bars où celle-ci est disponible. À l'aide de la carte et de sa fonction de localisation (_précision indépendante de notre volonté_), trouver les bars devient facile. La carte permet également de voir où se situent les plus de 200 brasseries inventoriées.

Il est possible de faire tout ceci depuis son ordinateur en attendant l'_happy hour_, sa tablette en sirotant une cervoise fraîche à la maison ou encore son _smartphone_ pour connaître sa commande avant même d'arriver dans le bar.

## Utilisation
Il suffit d'avoir accès à internet et de se rendre [ici](https://databinch.github.io)

Vous devriez ensuite trouver cette page d'accueil (_varie en fonction du support utilisé_) :

![alt text](/data/img_readme/1_acc.PNG "Page d'acceuil")

La page est divisée en 3 parties interactivement liées. Il y a les différents sélecteurs, le graphique comprenant les bières et la carte avec ses différents marqueurs.

Il est possible de survoler une bière du graphique ou un marqueur de la carte pour obtenir les informations à son égard :

![alt text](/data/img_readme/2_survol.PNG "Tooltip graphique au survol") &emsp; ![alt text](/data/img_readme/2bis_survol.PNG "Tooltip carte au survol")

Il y a plusieurs moyens de sélectionner une bière : soit en cliquant directement sur la bière dans le graphique, soit en effectuant une recherche à l'aide des sélecteurs (pareil pour bar et brasserie) situés en haut de la page :

![alt text](/data/img_readme/3_rech.PNG "Recherche dans le sélecteur")

Quand une bière est sélectionnée, toutes les informations à son sujet s'affichent en haut du graphique. Il est possible de cliquer sur le nom de la brasserie ou d'un bar pour voir les bières qui leur sont associées.
En bas à droite apparaissent les bières les plus similaires à celles sélectionnées. Il est également possible de cliquer soit sur le logo soit sur le nom pour avoir les informations y relatives. Sur le graphique, on retrouve la bière en grand ainsi que les 5 similaires en plus petit. En parallèle, la carte se déplace sur la brasserie d'où vient la bière.

![alt text](/data/img_readme/4_trouve.PNG "Page avec bière sélectionnée")

Il est également possible d'interagir depuis la carte en activant la localisation et en cliquant sur les différents marqueurs. En cliquant sur un marqueur, les bières disponibles ou brassées vont s'afficher dans le graphique de gauche. Ici, par exemple, avec le bar de l'Université de Lausanne :

![alt text](/data/img_readme/5_bar.PNG "Exemple de sélection d'un bar")

Il est également possible à tout moment de réafficher l'entier des bières en sélectionnant l'option _TOUTES_ ou _TOUS_ dans un des sélecteurs. Cela déplacera également la carte sur l'ensemble des bars.

![alt text](/data/img_readme/6_toutes.PNG "Option à choisir pour réinitialiser")

## Données

Comme mentionné auparavant, les bières représentées sont celles qui *ont été* disponibles dans les bars choisis. Elles ne sont ainsi plus nécessairement représentatives de l'état actuel des cartes. Nous ne pouvons qu'encourager les propriétaires de bars à davantage publier et actualiser régulièrement leurs cartes de bière en ligne pour permettre tant aux consommateurs d'être avertis qu'à notre base de données d'être facilement maintenable.

Dans un premier temps, il a fallu se renseigner sur les cartes des différents bars en consultant leurs sites, se rendant sur place ou obtenant des photos de leurs cartes. Dans une deuxième étape, les informations relatives aux bières ont été cherchées.

Si les données concernant le taux d'alcool ou le style de bière sont aisément accessibles à tout un chacun, la couleur (SRM/EBC) et l'amertume (IBU/EBU) ont subi une étape préalable de recherche intensive, mais pas toujours fructueuse. Dans ce dernier cas, une interpolation depuis le style de bière ou les "clones" pour le brassage amateur est effectuée. En dernier recours, les auteurs ont du recourir à l'expérimentation directe via la consommation.

Finalement, les coordonnées des différents bars et brasseries ont été récupérées pour ajouter une dimension géographique toujours bienvenue.

Un récapitulatif de la taille de notre base de données et des différents éléments la composant :

| Éléments | Nombre |
|:--------:|:------:|
|Bières    |678     |
|Brasseries|205     |
|Bars      |20      |

| Bière         |
|:-------------:|
|ID             |
|Bar            |
|Brasserie      |
|Nom            |
|Vol. alcool [%]|
|Couleur [SRM]  |
|Amertume [IBU] |
|Style**s**     |

|Brasseries|
|:--------:|
|Nom       |
|Latitude  |
|Longitude |

|Bars     |
|:-------:|
|Nom      |
|Latitude |
|Longitude|

## Distances et _recommender system_

Le principe d'un recommender system est de proposer à partir d'un produit source, une liste de produits proches basés sur une certaine similarité.
Nous avons appliqué ce principe aux bières de notre base de données et calculé une matrice de dissimilarité à partir des informations suivantes :
- Alcool
- Amertume
- Couleur
- Style, selon une classification ascendante hiérarchique que nous avons rapportée sur des attributs successifs de catégories de plus en plus fines

Le calcul de la dissimilarité prenant en compte des données catégorielles, nous avons eu recours à la distance de Gower qui permet de prendre en compte à la fois des données numériques et des données catégorielles.

La distance étant une dissimilarité, nous trions les distances par ordre croissant de façon à retourner les valeurs de distance les plus faibles afin d'obtenir les bières les plus proches de la bière sélectionnée.

### Cadre
Ce projet a été réalisé par Raphaël Bubloz et Romain Lacroix dans le cadre du cours _Visualisation de données (SP17)_ donné par Isaac Pante à l'Université de Lausanne.

Nous avons ainsi choisi de constituer notre propre jeu de données et de construire la visualisation sur celui-ci. L'ajout de la carte est un clin d'oeil à notre formation de géographes. Certaines parties du code mélangent les genres (par ex. sélections avec _jQuery_ ou en _javascript_ pur), mais reflètent ainsi les différentes habitudes au sein du duo. Habitudes que nous n'avons pas nécessairement voulu standardiser jusqu'au bout.

##### tl;dr
Statistiques et visualisations d'une large sélection de bières de bars lausannois

Disponible en ligne : https://databinch.github.io
