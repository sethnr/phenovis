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
    var c = this;
    var markers = this.getMarkers();
    var comp = this.getComposition();
    var dotSize = 15;
    if(this.getPxSize() < 20) {
	var bgMark = panel.add(pv.Dot)
	    .left(this.getPxX())
	    .top(this.getPxY())
	    .strokeStyle(pv.color("#aaa").alpha(0.4))
	    .fillStyle(pv.color("#aaa").alpha(0.5))
	    .radius(10)
	    .cursor("pointer")
//	    .event("click", function() {c.popUp()})
    ;

    }

    if(comp.length == 1) {
	mark = panel.add(pv.Dot);

	mark.left(this.getPxX())
	.top(this.getPxY())
	.strokeStyle(z(comp[0].z))
	.fillStyle(z(comp[0].z).alpha(0.8))
	.radius(this.getPxSize() / 2)
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
	.text(function(d) {return d.points.length+" "+d.z});

    }

    mark.
    cursor("pointer").
    event("click", function() {c.popUp()})
    ;
    

    var sqrt = Math.ceil(Math.sqrt(c.getSize()));

    //add popup panel
    this.popup_ = panel
    .add(pv.Panel);
    this.popup_.left(this.getPxX())
    .top(this.getPxY())
    .width((sqrt+1)*dotSize)
    .height((sqrt+1)*dotSize)
    .fillStyle(pv.color("#fff").alpha(0.5))
    .strokeStyle("grey")
    .add(pv.Dot)
    .data(markers)
    .radius(5)
    .left(function(d) {return ((this.index % sqrt)+1) * dotSize})
    .top(function(d) {return Math.floor(((this.index) / sqrt) + 1) * dotSize})
    .fillStyle(function(d) {return z(d.z)})
    .strokeStyle(function(d) {return z(d.z)})
    .cursor("pointer").event("click",function(d) {console.log("clicked "+d.z);})
    ; 
//    console.log("popM="+popM.data.length+"\tmark="+mark.data.length);

//    console.log(mark+" "+mark.type+"\t"+popM+" "+popM.type);   
//    this.popup_ = popM;

   this.popup_
    .def("active", false)
    .visible(function() {/*console.log(c.popup_.active()+" "+this.active()); */return this.active()})
    ;

//    console.log(this.popup_);
    return mark;
}

/**
 * spawn popup menu for cluster.
 *
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.popUp = function() {
//    var popM = this.popup_;
//    this.popup_.active(false);
//    console.log("pop: " + this.popup_+" - "+this.popup_.active()+" \tvis:"+this.popup_.visible());
    this.geoplot_.closePops();
    this.popup_.active(true).render();
    //this.popup_.visible(true);
//    console.log("pop: " + this.popup_+" - "+this.popup_.active()+" \tvis:"+this.popup_.visible());
//    this.popup_.render();
}
/**
 * spawn popup menu for cluster.
 *
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.popDown = function() {
//    var popM = this.popup_;
//    console.log("pop: " + this.popup_.active()+" "+this.popup_.visible());
    this.popup_.active(false).render();
//    console.log("pop: " + this.popup_.active()+" "+this.popup_.visible());
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
