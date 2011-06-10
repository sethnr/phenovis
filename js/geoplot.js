/*
function getDataHash_jsp (json, est, xst, yst, zst) {

  function getVal (json, est, ost, vst) {
      var estHash = est.split('.');
      var ostHash = ost.split('[');
      for (var i = estHash.length; i> 1; i--) {
	  var esst = estHash.slice(0,i).join(".");
//	  console.log(esst+" "+vst.indexOf(esst));
	  if(vst.indexOf(esst) >= 0) {
	      var osst = ostHash.slice(0,i).join("[");
	      
	      var vpth = vst.replace(esst,osst);
	      var vobj = jsonPath(json,vpth);
//	      console.log(vpth+"\t"+vobj);
	      if(vobj.length==1) {return vobj[0];}
	      else {return vobj};
	  }
      }
      return undefined;
  }

  var paths = jsonPath(json, est,{resultType:"PATH"});
  console.log(est+" "+paths.length);

  var dataHash = paths.map(function(d,i) {
      var retHash =  {x: getVal(json, est, d,xst),  
		      y: getVal(json, est, d,yst), 
		      z: getVal(json, est, d,zst),
		      o: getVal(json, est, d,est)
      };
      return retHash;});
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}
*/
/*
function getDataHash_map (data,xstring, ystring, zstring) {
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
	      }},valHash);
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}
*/

function geoplot(posHash, mapDiv) {


    function Canvas(mapPoints, map){
	this.mapPoints = mapPoints;
	this.map = map;

	var bounds = this.getBounds(mapPoints, 0.05);
	map.fitBounds(bounds);
//	google.maps.event.addListener(map, 'click', this.closePops());
	this.setMap(map);
	this.panel_ = new pv.Panel().overflow("visible");
	this.clusters_ = [];
	this.z = pv.Colors.category10();
	return this;
    }
    
    Canvas.prototype = pv.extend(google.maps.OverlayView);
    
    Canvas.prototype.onAdd = function(){
	this.canvas = document.createElement("div");
	this.canvas.setAttribute("class", "canvas");
	this.canvas.style.position="absolute";
	var c = this;
	google.maps.event.addListener(this.getMap(), 'click', function(){c.closePops()});
	
	var pane = this.getPanes().overlayMouseTarget;
	
	pane.appendChild(this.canvas);
	
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

	var subPanel = mapPanel
	.canvas(c)
	.left(-x.min)
	.top(-y.min)
	.add(pv.Panel)
	;
	for (var i=0; i< this.clusters_.length; i++) {
	    this.clusters_[i].addPVMark(mapPanel, z); 
	}
	
	mapPanel.root.render();
    }

    Canvas.prototype.closePops = function() {
// console.log(this.clusters_);
	if(this.clusters_) {
	    for (var i=0; i< this.clusters_.length; i++) {
		this.clusters_[i].popDown(); 
	    }
	}
    }

    //add the map
    var myOptions = {
    mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(mapDiv,
				  myOptions);
    //add the overlay canvas
    var geoverlay = new Canvas(posHash, map);


    
    return geoverlay;
    
}
    