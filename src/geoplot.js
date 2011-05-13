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
	     z: zval,
	  }},valHash);
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}
 
function geoplot(posHash, mapDiv) {
 
    function Canvas(mapPoints, map){
	this.mapPoints = mapPoints;
	this.map = map;
	this.setMap(map);
    }
    		
    Canvas.prototype = pv.extend(google.maps.OverlayView);
    var z = pv.Colors.category10();
    
    Canvas.prototype.onAdd = function(){
	this.canvas = document.createElement("div");
	this.canvas.setAttribute("class", "canvas");
	this.canvas.style.position="absolute";
	
	this.getPanes().mapPane.appendChild(this.canvas);
    }
    
    Canvas.prototype.draw = function(){
	var m = this.map;
	var c = this.canvas;
	var r = 20;
	
	var projection = this.getProjection();
	
	var pixels = this.mapPoints.map(function(d) {
		var ll = new google.maps.LatLng(d.x, d.y);
		
		return projection.fromLatLngToDivPixel(ll);
	    });	    
	
	function x(p) p.x; function y(p) p.y;
	
	pv.max(pixels, y) + r
	
	var x = { min: pv.min(pixels, x) - r, max: pv.max(pixels, x) + r };
	var y = { min: pv.min(pixels, y) - r, max: pv.max(pixels, y) + r };
	c.style.width = (x.max - x.min) + "px";
	c.style.height = (y.max - y.min) + "px";
	c.style.left = x.min + "px";
	c.style.top = y.min + "px";
	
	/*	alert("x = "+x.min+"->"+x.max+"\n"+"y = "+y.min+"->"+y.max+
		"\nwidth = "+c.style.width+
		"\nheight = "+c.style.height+
		"\nleft = "+c.style.left+
		"\ntop = "+c.style.top
		);		
	*/
	new pv.Panel()
	.canvas(c)
	.left(-x.min)
	.top(-y.min)
	.add(pv.Panel)
	.data(this.mapPoints)
	.add(pv.Dot)
	.left(function() pixels[this.parent.index].x)
	.top(function() pixels[this.parent.index].y)
	.strokeStyle(function(d) z(d.z))
	.fillStyle(function(d) z(d.z).alpha(.2))
	.size(140)
	.anchor("center").add(pv.Label)
	.textStyle("white")
	.text(function(x, d) d.z)
	.root.render();
	
    }
    //add the map
    var myOptions = {
    zoom: 7,
    center: new google.maps.LatLng(12.8, -8.05),
    mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(document.getElementById("fig"),
				  myOptions);
    //add the overlay canvas
    var overlay = new Canvas(posHash, map);
    return overlay;
    
}
    
