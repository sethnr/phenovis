
function geoplot(posHash, div) {

    function Legend(posHash, ldiv, zvals, z) {	
	ldiv.setAttribute("class", "legend");
	lpanel = new pv.Panel;
	lpanel
//	    .strokeStyle('green')
	    .fillStyle(pv.color("#fff").alpha(0.7))
	    .canvas(ldiv);
	addLegend(lpanel, zvals, z);
	lpanel.render();

    }



    function Canvas(mapPoints, map){
	this.mapPoints = mapPoints;
	this.map = map;

	
	var bounds = this.getBounds(mapPoints, 0.05);
	map.fitBounds(bounds);
//	google.maps.event.addListener(map, 'click', this.closePops());
	this.setMap(map);
	this.panel_ = new pv.Panel().overflow("visible");
	this.clusters_ = [];
	this.z = pv.Colors.category20();
	return this;
    }
    
    Canvas.prototype = pv.extend(google.maps.OverlayView);
    
    Canvas.prototype.onAdd = function(){
	this.canvas = document.createElement("div");
	this.canvas.setAttribute("class", "canvas");
	this.canvas.style.position="absolute";
	var c = this;
	google.maps.event.addListener(this.getMap(), 'click', function(){c.closePops()});
	
	
/* CODE TO OVERLAY DIRECTLY ON MAP NOT WORKING */
/*
	this.legend = document.createElement("div");
	this.legend.style.position="absolute";
	var zvals = this.mapPoints.collect(function(d) {return d.z});

	lpanel = new pv.Panel;	
	this.lpanel = lpanel;
	lpanel.strokeStyle('green').canvas(this.legend);
	addLegend(lpanel, zvals, this.z);
*/	
	
	var panes = this.getPanes();
//	panes.floatPane.appendChild(this.legend);
	panes.overlayMouseTarget.appendChild(this.canvas);
	
    }
    

    Canvas.prototype.getMap = function(){
	return this.map;
    }

    Canvas.prototype.getBounds = function(pointsHash, margin) {
	var b = pv.min(pointsHash, function(d) {return d.y});
	var l = pv.min(pointsHash, function(d) {return d.x});
	var t = pv.max(pointsHash, function(d) {return d.y});
	var r = pv.max(pointsHash, function(d) {return d.x});
	var mar = 0;
	if(margin >= 0) {mar = margin;}
	var wmar = (r-l)*mar;
	var hmar = (t-b)*mar;
	
	var myBounds = new google.maps.LatLngBounds(new google.maps.LatLng(l-wmar,b-hmar),
				      new google.maps.LatLng(r+wmar,t+hmar));
	return myBounds;
    }

    Canvas.prototype.getPanel = function(){
	return this.panel_;
    }
   
    Canvas.prototype.setPanel = function(newPanel){
	this.panel_ = newPanel;
    }
   
    Canvas.prototype.draw = function(){
	
	var m = this.map;
	var c = this.canvas;
	var r = 200;
	var z = this.z;
	
	var projection = this.getProjection();
	
	var cSet = new ClusterSet(this, this.mapPoints);
	this.clusters_ = cSet.getClusters();

	var pixels = this.mapPoints.map(function(d) {
		var ll = new google.maps.LatLng(d.x, d.y);
		return projection.fromLatLngToDivPixel(ll);
	    });	    
	
	function x(p) {return p.x}; function y(p) {return p.y};
	
	var x = { min: pv.min(pixels, x) - r, max: pv.max(pixels, x) + r };
	var y = { min: pv.min(pixels, y) - r, max: pv.max(pixels, y) + r };

	c.style.width = (x.max - x.min) + "px";
	c.style.height = (y.max - y.min) + "px";
	c.style.left = x.min + "px";
	c.style.top = y.min + "px";

	var mapPanel = new pv.Panel();

//	mapPanel.strokeStyle('red');

	// var subPanel = 
	mapPanel
	.canvas(c)
	.left(-x.min)
	.top(-y.min)
//	.add(pv.Panel)
	;
	for (var i=0; i< this.clusters_.length; i++) {
	    this.clusters_[i].addPVMark(mapPanel, z); 
	}
	
	mapPanel.root.render();
	
    }

    Canvas.prototype.closePops = function() {
	if(this.clusters_) {
	    for (var i=0; i< this.clusters_.length; i++) {
		this.clusters_[i].popDown(); 
	    }
	}
    }

    //add the map
    var zvals = posHash.collect(function(d) {return d.z});

    var lDiv = document.createElement("div");
    lDiv.style.width = estLegendWidth(zvals);
    lDiv.style.height = estLegendHeight(zvals);

    lDiv.style.right = 10;
    lDiv.style.bottom = 30;
    lDiv.style.borderRadius = 5;
    lDiv.style.position = "absolute";
    lDiv.style.zIndex = "99"; 

    var map = new google.maps.Map(div, { mapTypeId: google.maps.MapTypeId.TERRAIN}  );
    //add the overlay canvas
    var geoverlay = new Canvas(posHash, map);
    div.appendChild(lDiv);
    var legend = new Legend(posHash, lDiv, zvals, geoverlay.z);
   
    return geoverlay;
    
}
    