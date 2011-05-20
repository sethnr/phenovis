function getDataHash_map (xstring, ystring, zstring) {
  var valHash = new Hash();
  valHash.set("X",findVals(xstring, data));
  valHash.set("Y",findVals(ystring, data));
  valHash.set("Z",findVals(zstring, data));
  
  var dataHash = data.stocks.map(function(d,i) {
      var xval = this.get("X")[i];
      var yval = this.get("Y")[i];
      var zval = this.get("Z")[i];
      return {x: xval,  
	     y: yval, 
	     z: zval
	      /* obj: jsonobject */
	      }},valHash);
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}


function geoplot(posHash, mapDiv) {


    function Canvas(mapPoints, map){
	this.mapPoints = mapPoints;
	this.map = map;

	var bounds = this.getBounds(mapPoints, 0.05);
	map.fitBounds(bounds);

	this.setMap(map);
	this.panel_ = new pv.Panel().overflow("visible");

//	this.z = pv.Colors.category10();
	return this;
    }
    
    Canvas.prototype = pv.extend(google.maps.OverlayView);
    
    Canvas.prototype.onAdd = function(){
	this.canvas = document.createElement("div");
	this.canvas.setAttribute("class", "canvas");
	this.canvas.style.position="absolute";
	
	this.getPanes().mapPane.appendChild(this.canvas);
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
	var z = pv.Colors.category10();
	
	var projection = this.getProjection();
	
	var cSet = new ClusterSet(this, this.mapPoints);
	var clusters = cSet.getClusters();

//	for(var ci=0; ci<clusters.length && ci < 6; ci++) {
//	    alert(ci+" "+clusters[ci].markers_.length);
//	}
	

	var pixels = this.mapPoints.map(function(d) {
		var ll = new google.maps.LatLng(d.x, d.y);
		return projection.fromLatLngToDivPixel(ll);
	    });	    
	
	function x(p) {return p.x}; function y(p) {return p.y};
	
	// pv.max(pixels, y) + r;
	
	var x = { min: pv.min(pixels, x) - r, max: pv.max(pixels, x) + r };
	var y = { min: pv.min(pixels, y) - r, max: pv.max(pixels, y) + r };

	c.style.width = (x.max - x.min) + "px";
	c.style.height = (y.max - y.min) + "px";
	c.style.left = x.min + "px";
	c.style.top = y.min + "px";

	var mapPanel = new pv.Panel();

/*
	mapPanel
	.canvas(c)
	.left(-x.min)
	.top(-y.min)
	.add(pv.Panel)
	.data(this.mapPoints)	
	.add(pv.Dot)
	.left(function() {return pixels[this.parent.index].x})
	.top(function() {return pixels[this.parent.index].y})
	.strokeStyle(function(d) {return z(d.z)})
	.fillStyle(function(d) {return z(d.z).alpha(.2)})
	.size(140)
	.anchor("center").add(pv.Label)
	.textStyle("white")
	.text(function(x, d) {return d.z});
*/


	var subPanel = mapPanel
	.canvas(c)
	.left(-x.min)
	.top(-y.min)
	.add(pv.Panel)
;

//	mapPanel.strokeStyle("blue");
	for (var i=0; i< clusters.length; i++) {
	    clusters[i].addPVMark(mapPanel, z); 
	    
/*	    var clustMark = subPanel.add(pv.Mark);
	    clustMark = mark;
	    alert(mark.type+" "+clustMark.type+"\n"+
		  mark.parent+" "+clustMark.parent);
*/
	}
//	.data(clusters)
//	.add(pv.Dot).extend(function(d) {return d.getPVMark();});

/*
	.add(pv.Dot)
	.left(function(d) {return d.getPxX()})
	.top(function(d) {return d.getPxY()})

	.strokeStyle(function(d) {return z(d.markers_[0].z)})
	.fillStyle(function(d) {return z(d.markers_[0].z).alpha(.7)})
	.radius(function(d) {return d.getPxSize() / 2;})
	.anchor("center").add(pv.Label)
	.textStyle("white")
//	.text(function(x, d) {return d.markers_[0].z});
	.text(function(x, d) {return d.getSize()+" "+d.getComposition()});
*/
	
	mapPanel.root.render();
/*
alert(myData.root.children.length+"\n"+
      myData.root.children[0].children.length+"\n"+
      myData.root.children[0].children[0].children+"\n"+
      myData.root.children[0].children[1].children+"\n"

    );
*/	
	
//	return mapPanel;
	mapPanel.root.render();

    }
    //add the map
    var myOptions = {
//    zoom: 7,
//    center: new google.maps.LatLng(12.8, -8.05),
    mapTypeId: google.maps.MapTypeId.TERRAIN
    };
//    var map = new google.maps.Map(document.getElementById("fig"),
    var map = new google.maps.Map(mapDiv,
				  myOptions);
    //add the overlay canvas
    var geoverlay = new Canvas(posHash, map);


    
    return geoverlay;
    
}
    
//geoplot.prototype