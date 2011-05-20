/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(geoplot) {
  this.geoplot_ = geoplot;
  this.map_ = geoplot.getMap();
  this.sizeFactor_ = 3;
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  this.projection_ = geoplot.getProjection();;
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.addPVMark = function(panel, z) {
    var mark;
    var markers = this.getMarkers();
    var comp = this.getComposition();

    if(comp.length == 1) {
	mark = panel.add(pv.Dot)    
	    .left(this.getPxX())
	    .top(this.getPxY())
	    .strokeStyle(z(comp[0].z))
	    .fillStyle(z(comp[0].z).alpha(0.4))
	    .radius(this.getPxSize() / 2)
	    .anchor("center")
	    .add(pv.Label)
	    .textStyle("white")
	    .text(this.getSize()+" "+comp[0].z);
    }
    else {
	
	mark = panel.add(pv.Panel)
	.left(this.getPxX())
	.top(this.getPxY())
	//.width(this.getPxSize())
	//.height(this.getPxSize())
	//.fillStyle("blue")

;
	
/*	mark.add(pv.Label)
	.textStyle("white")
	.text(this.getSize()+" mixed ("+comp.length+" strains)");
*/
	var wedge = mark.add(pv.Wedge)
	.data(comp)
	.angle(function(d) {/*
			      alert(d+" "+this.type+":"+this.index+" "+this.parent.type+":"+this.parent.index); */
return (d.points.length / markers.length * 2 * Math.PI)})
	.left(0)
//	.title(function(d) {return d.z})
	.fillStyle(function(d) {alert(d+" "+d.z); return z(d.z).alpha(0.8)})
	.strokeStyle("gray")
	.top(0)
	.outerRadius(this.getPxSize()/2)
	.anchor("center").add(pv.Label).textAngle(0)
	.textStyle("white")
	.text(function(d) {return d.points.length+" "+d.z});
	
//	wedge.angle(function(d) {return d /100 * 2 * Math.PI})
//	.fillStyle(function(d) {return z(d)})
//	wedge.title(d);	

/*	mark = panel.add(pv.Dot)    
	    .left(this.getPxX())
	    .top(this.getPxY())
	    .strokeStyle("red")
	    .fillStyle(z("mixed").alpha(0.4))
	    .radius(this.getPxSize() / 2)
	    .anchor("center")
	    .add(pv.Label)
	    .textStyle("white")
	    .text(this.getSize()+" ("+comp.length+" strains)");
*/
    }

    return mark;
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
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
 * @param {google.maps.Marker} marker The marker to add.
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
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
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
    return this.bounds_();
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
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function() {
  return this.markers_.length;
};

/**
 * Returns the composition of the cluster
 *
 * @return {string} single z val, or 'mixed'
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
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
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
      return this.markers_.length * this.sizeFactor_;
}

Cluster.prototype.getSize = function() {
      return this.markers_.length;
}

/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.LatLon} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isPosInClusterBounds = function(pos) {
  var contains = this.bounds_.contains(pos);
//  alert(this.bounds_+" contains "+pos+" = "+contains);
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
  this.map_ = geoplot.getMap();
  this.sizeFactor_ = 5;

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
}


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {??} marker The marker to add.
 * @private
 */
ClusterSet.prototype.addMarker = function(marker) {
  var pos = new google.maps.LatLng(marker.x, marker.y);
//  alert(marker.x+" "+marker.y+"\t"+pos);

  clustersAdded = 0;
  for(var i=0; i< this.clusters_.length; i++) {
	var cluster = this.clusters_[i];
	// alert(i+" "+cluster.isPosInClusterBounds(pos));
	if(cluster.isPosInClusterBounds(pos)) {
	    cluster.addMarker(marker);
	    clustersAdded++;
	    break;
	}
  }
  if(clustersAdded < 1) {
      var cluster = new Cluster(this.geoplot_);
      cluster.addMarker(marker);
      this.clusters_.push(cluster);
  }
}