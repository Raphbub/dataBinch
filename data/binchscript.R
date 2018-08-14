library("RJSONIO")
library("cluster")
library("igraph")

setwd("~/dataBinch/data")
binches <- fromJSON("binches.json")

binches <- lapply(binches, function(x) {
  x[sapply(x, is.null)] <- NA
  unlist(x)
})

binches <- do.call("rbind", binches)

binches <- as.data.frame(binches)

binchUnique <- binches[,4:11]
binchUnique <- unique(binchUnique, incomparables = FALSE)

binchDist <- binchUnique[,-1]


binchDist$ABV <- as.numeric(as.character(sub("," , ".", binchDist$ABV)))
binchDist$IBU <- as.numeric(as.character(sub("," , ".", binchDist$IBU)))
binchDist$SRM <- as.numeric(as.character(sub("," , ".", binchDist$SRM)))

dist <- daisy(binchDist, metric = "gower")
dist <- as.matrix(dist)
rownames(dist) <- binchUnique[,1] 
colnames(dist) <- binchUnique[,1] 
g <- graph.adjacency(dist, mode = "directed", weighted = TRUE)
e <- cbind( get.edgelist(g) , round( E(g)$weight, 3 ))
e <- as.data.frame(e)
colnames(e)[1]<-"Source"
colnames(e)[2]<-"Target"
colnames(e)[3]<-"Weight"
 
write.csv(e, file="rowdist.csv", row.names = FALSE)
 