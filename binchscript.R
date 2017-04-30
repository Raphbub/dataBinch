library("RJSONIO")
library("cluster")

setwd("dataBinch")
binches <- fromJSON("binches.json")

binches <- lapply(binches, function(x) {
  x[sapply(x, is.null)] <- NA
  unlist(x)
})

binches <- do.call("rbind", binches)

binches <- as.data.frame(binches)

binchUnique <- binches[,4:12]
binchUnique <- binchUnique[,-2]
binchUnique <- unique(binchUnique, incomparables = FALSE)

binchDist <- binchUnique[,-1]


binchDist$ABV <- as.numeric(as.character(sub("," , ".", binchDist$ABV)))
binchDist$IBU <- as.numeric(as.character(sub("," , ".", binchDist$IBU)))
binchDist$SRM <- as.numeric(as.character(sub("," , ".", binchDist$SRM)))

dist <- daisy(binchDist, metric = "gower")
dist <- as.matrix(dist)
rownames(dist) <- binchUnique[,1] 
colnames(dist) <- binchUnique[,1] 

write.csv(dist, file="binches_distance_matrix.csv")

