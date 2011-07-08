/**
 * A cluster that contains markers.
 *
 * @param {geoplot} the geoplot that this
 *     cluster will be placed on.
 * @constructor
 */
function Cluster(geoplot) {
  this.geoplot_ = geoplot;
  this.map_ = geoplot.getMap();
  this.markerSize_;
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  this.projection_ = geoplot.getProjection();;
}

/**
 * add protovis visualisation for this cluster - dependent on size and composition
 * defaults to pie chart
 * @param {panel, z} pv.Panel to which will be added + z-scale for colouring.
 * @return {pv.Mark} the mark class
 */
Cluster.prototype.addPVMark = function(panel, z) {
    var mark;
    var c = this;
    var markers = this.getMarkers();
    var comp = this.getComposition();
    var dotSize = this.markerSize_;

    if(this.getPxSize() < 20) {
	var bgMark = panel.add(pv.Dot)
	    .left(this.getPxX())
	    .top(this.getPxY())
	    .strokeStyle(pv.color("#aaa").alpha(0.4))
	    .fillStyle(pv.color("#aaa").alpha(0.5))
	    .radius(10)
	    .cursor("pointer").event("click", function() {c.popUp()})
    ;

    }

    if(comp.length == 1) {
	mark = panel.add(pv.Dot);

	mark.left(this.getPxX())
	.top(this.getPxY())
	.strokeStyle(z(comp[0].z))
	.fillStyle(z(comp[0].z).alpha(0.8))
	.radius(this.getPxSize()/2)
	.cursor("pointer").event("click", function() {c.popUp()})
	.anchor("center")
	.add(pv.Label)
	.textStyle("white")
	.text(this.getSize()+" "+comp[0].z);
    }
    else {
	mark = panel.add(pv.Panel);
	mark
	.left(this.getPxX())
	.top(this.getPxY())
	.add(pv.Wedge)
	.cursor("pointer")
	.data(comp)
	.angle(function(d) {return (d.points.length / markers.length * 2 * Math.PI)})
	.fillStyle(function(d) {return z(d.z).alpha(0.8)})
	.strokeStyle("gray")
	.outerRadius(this.getPxSize()/2)
	.anchor("center").add(pv.Label).textAngle(0)
	.textStyle("white").cursor("pointer")
	.text(function(d) {return d.points.length /*+" "+d.z*/});

    }

    mark.
    cursor("pointer").
    event("click", function() {c.popUp()})
    ;
    

    var sqrt = Math.ceil(Math.sqrt(c.getSize()));
//    console.log(sqrt+" x "+dotSize);

    //add popup panel
    this.popup_ = panel
    .add(pv.Panel);
    this.popup_.left(this.getPxX())
    .top(this.getPxY())
    .width((sqrt+1)*dotSize*3)
    .height((sqrt+1)*dotSize*3)
    .fillStyle(pv.color("#fff").alpha(0.5))
    .strokeStyle("grey")
    .add(pv.Dot)
    .data(markers)
    .radius(dotSize)
    .left(function(d) {return ((this.index % sqrt)+1) * dotSize * 3 })
    .top(function(d) {return Math.floor(((this.index) / sqrt) + 1) * dotSize * 3})
    .fillStyle(function(d) {return z(d.z)})
    .strokeStyle(function(d) {return z(d.z)})
    .cursor("pointer")
    .event("mouseover", function(d) {/*console.log(d.o.id); */self.status = ("sample  "+d.o.id);})
    .event("mouseout", function() {self.status = "";})
    .event("click", function(d) {self.location = config.ROOT+"/sample/?id="+d.o.id})
//    event("click",function(d) {console.log("clicked "+Object.toJSON(d.o.id));})
    ; 

   this.popup_
    .def("active", false)
    .visible(function() {return this.active()})
    ;

    return mark;
}

/**
 * spawn popup menu for cluster.
 */
Cluster.prototype.popUp = function() {
    this.geoplot_.closePops();
    this.popup_.active(true).render();
}
/**
 * close popup menu for cluster
 */
Cluster.prototype.popDown = function() {
    this.popup_.active(false).render();
}


/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {dataObject} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
  if (this.markers_.indexOf) {
    return this.markers_.indexOf(marker) != -1;
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        return true;
      }
    }
  }
  return false;
};



/**
 * Add a marker to the cluster.
 *
 * @param {dataMarker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function(marker) {
  if (this.isMarkerAlreadyAdded(marker)) {
    return false;
  }

  if (!this.center_) {
    this.center_ = new google.maps.LatLng(marker.x, marker.y);
  } 
  else {    
    if (this.averageCenter_) {
      var l = this.markers_.length + 1;
      var lat = (this.center_.lat() * (l-1) + marker.x) / l;
      var lng = (this.center_.lng() * (l-1) + marker.y) / l;
      this.center_ = new google.maps.LatLng(lat, lng);
    }
  }

  marker.isAdded = true;
  this.markers_.push(marker);
  this.calculateBounds_();

  return true;
};


/**
 * Returns the geoplot that the cluster is associated with.
 *
 * @return {geoplot} The associated marker clusterer.
 */
Cluster.prototype.getGeoplot = function() {
  return this.geoplot_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function() {
    if (!this.bounds_) {
	this.calculateBounds_(); }
    return this.bounds_;
};


/**
 * Removes the cluster
 */
Cluster.prototype.remove = function() {
  this.clusterIcon_.remove();
  this.markers_.length = 0;
  delete this.markers_;
};


/**
 * Returns the composition of the cluster
 *
 * @return {array of objects {z: [distinct] z-value; obj: data objects}}'
 */
Cluster.prototype.getComposition = function() {
    var markers = this.markers_;
    var zs = markers.collect(function(d) {return d.z}).uniq();
    zs = zs.map(function(d) {return {z: d, points: markers.findAll(function(e) {return e.z == d;})}});
    return zs;
//    if(zs.length ==1) {return zs[0];}
//    else {return "mixed";}
};


/**
 * Returns all markers.
 *
 * @return {[]} array of data objects.
 */
Cluster.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function() {
  return this.center_;
};

/**
 * return pixel position for center of map
 * @return {real} .
 */
Cluster.prototype.getPxX = function() {
    return this.projection_.fromLatLngToDivPixel(this.center_).x;
}

/**
 * return pixel position for center of map
 * @return {real} .
 */
Cluster.prototype.getPxY = function() {
    return this.projection_.fromLatLngToDivPixel(this.center_).y;
}


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);

//  var projection = this.getGeoplot().getProjection();
  var projection = this.projection_;

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  var spotSize = this.getPxSize();
  trPix.x += spotSize/2;
  trPix.y -= spotSize/2;

  var blPix = projection.fromLatLngToDivPixel(bl);
  blPix.x -= spotSize/2;
  blPix.y += spotSize/2;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);
  this.bounds_ = bounds;
  return bounds;
};

Cluster.prototype.getPxSize = function() {
//    console.log(this.markers_.length+" "+Math.sqrt((this.markers_.length / Math.PI)));
    var area = Math.sqrt((this.markers_.length / Math.PI));
    var sizeFactor = this.markerSize_ / (Math.sqrt(1/Math.PI));
//    console.log(this.markers_.length+": "+area+" x "+sizeFactor+" = "+(area*sizeFactor));
    return area * sizeFactor * 2;
    //return this.markers_.length * this.sizeFactor_;

}

Cluster.prototype.getSize = function() {
      return this.markers_.length;
}

Cluster.prototype.setMarkerSize = function(size) {
      this.markerSize_ = size;
}

/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.LatLon} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isPosInClusterBounds = function(pos) {
  var contains = this.bounds_.contains(pos);
//  console.log(this.bounds_+" contains "+pos+" = "+contains);
  return contains;
};

/**
 * Determines if a cluster lies partially or wholly in the clusters bounds.
 *
 * @param {google.maps.LatLon} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.doesClusterOverlap = function(clust) {
  var contains = this.bounds_.intersects(clust.bounds_);
//  console.log(this.bounds_+" contains "+pos+" = "+contains);
  return contains;
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function() {
  return this.map_;
};


/**
 * A ClusteredSet that contains clusters and markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function ClusterSet(geoplot, data) {
  this.geoplot_ = geoplot;
  this.data_ = data;
//  this.data.sort(function(d) {return d.y});
  this.map_ = geoplot.getMap();
  this.markerSize_ = 5;

  this.clusters_ = [];
  this.makeClusters_();
}

/**
 * return clusters
 * @private
 */
ClusterSet.prototype.getClusters = function() {
    return this.clusters_;
}

/**
 * cycle through points in data_, add overlaps into clusters
 * datum = {x: lat, y: lon, z: var}
 * @private
 */
ClusterSet.prototype.makeClusters_ = function() {
    this.clusters_ = [];
    for(var i=0; i< this.data_.length; i++) {
	var datum = this.data_[i];
	// alert(datum+", "+this.data_.length);
	this.addMarker(datum);
    }

/*
    for (var i =0; i<this.clusters_.length; i++) {
	var cluster = this.clusters_[i]
	console.log(i+" "+cluster.getSize()+"\n"+cluster.getBounds()+" "+cluster.getCenter());
    }
*/
    this.checkClusterOLs();

}

ClusterSet.prototype.checkClusterOLs = function() {
    for (var i =0; i<this.clusters_.length; i++) {
	for (var j=0; j<this.clusters_.length; j++) {
	    var clI = this.clusters_[i];
	    var clJ = this.clusters_[j];
	    if((j != i) && clI.doesClusterOverlap(clJ)) {
//		console.log(clI.getSize()+" overlaps "+clJ.getSize());
		
		// only do in most efficient direction 
		// (if not leave till overlap is found in other direction)
		if(clI.getSize() > clJ.getSize()) {
		    this.clusters_.splice(j,1);
		    var mergedMarkers = clJ.getMarkers();
		    for(var k = 0; k< mergedMarkers.length; k++) {
			clI.addMarker(mergedMarkers[k]);
			}
		    j=0; i=0;
		}
	    }
	}	
    }
    
}


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {??} marker The marker to add.
 * @private
 */
ClusterSet.prototype.addMarker = function(marker) {
  var pos = new google.maps.LatLng(marker.x, marker.y);

  clustersAdded = 0;
  for(var i=0; i< this.clusters_.length; i++) {
	var cluster = this.clusters_[i];
	if(cluster.isPosInClusterBounds(pos)) {
	    cluster.addMarker(marker);
	    clustersAdded++;
	    break;
	}
  }
  if(clustersAdded < 1) {
      var cluster = new Cluster(this.geoplot_);
      cluster.setMarkerSize(this.markerSize_)
      cluster.addMarker(marker);
      this.clusters_.push(cluster);
  }
}
