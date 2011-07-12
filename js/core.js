/** set defaults if no config */
// if(!config.ROOT) (config.ROOT = document.location.hostname;)


/**
 * passes values through to actual graph calls, based on text 
 * description in DB. Nothing else. (to prevent CSS attacks)
 * @params type - the graph type to call 
 *         dataHash - data hash to call
 *         div - div to put it in
 *         args - additional args for function (optional)
 */
function callPlot(type, dataHash, div, args) {
    var functions = {
	"map":"geoplot",
	"geoplot":"geoplot",
	"dot":"dotplot",
	"bar":"groupedBarChart",
	"groupbar":"groupedBarChart",
	"matrix":"frequencyMatrix"
    };
    eval(functions[type]+"(dataHash, div, args)");

}

/**
 * the core method... traverse json structure to retrieve array of hashes
 * each hash has 4 vals: x/y/z vals and 'o' the json object we iterate over
 * @params json - the json object to be parsed 
 *         est - jsonPath String to the entity we iterate over
 *         x/y/zst - jsonpath String to the x/y/z val
 */
function getDataHash_jsp (json, est, xst, yst, zst) {

  function getVal (json, est, pst, vst) {
      var estHash = est.split('.');
      var pstHash = pst.split('[');
      for (var i = estHash.length; i> 1; i--) {
	  var esst = estHash.slice(0,i).join(".");
//	  console.log(esst+" "+vst.indexOf(esst));
	  if(vst.indexOf(esst) >= 0) {
	      var psst = pstHash.slice(0,i).join("[");
	      
	      var vpth = vst.replace(esst,psst);
	      var vobj = jsonPath(json,vpth);
//	      console.log(vpth+"\t"+vobj);
	      if(vobj.length==1) {return vobj[0];}
	      else {return vobj};
	  }
      }
      return undefined;
  }

  var paths = jsonPath(json, est,{resultType:"PATH"});

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
/** add legend to any panel */
function addLegend(panel, zvals, zscale) {
//    console.log("adding legend to " +panel);
    panel.add(pv.Dot)
	.data(zvals.uniq().sort())
	.right(10)
	.top(function(d) {return this.index * 12 + 10})
	.fillStyle(function(d) {return zscale(d)})
	.strokeStyle(null)
        .anchor("left").add(pv.Label)
	.text(function(d) {return d});
    return panel;
}

function estLegendSize(vals) {
    return estLegendWidth(vals);
}

function estLegendHeight(vals) {
    var cSize = 12;
    return (vals.uniq().length * cSize)+10;
}

function estLegendWidth(vals) {
    var dotSize = 30; var cSize = 6;
    return (vals.max(function(z) {return Number(z.length)}) * cSize) + dotSize;
}

/** get width by any method */
function getDivWidth(div) {
    var width;
    width = div.style.width || div.offsetWidth || div.getWidth();
    width = new String(width).replace("px","");
//    console.log(width);
    return width;
}

/** get height by any method */
function getDivHeight(div) {
    var height;
    height = div.style.height || div.offsetHeight || div.getHeight();
    height = new String(height).replace("px","");
//    console.log(height);
    return height;
}


/*
 * inplace edit the passed array of hashes, expecting
 * [ { x: ..., y: ..., z: ..., e: ... }, ... ]
 *
 * if x == y and not numeric then do a google geocode lookup
 *
 */

function geocodeLocationNames(dataHash, callback) {
	var geoCache = new Object();
	var geocoder = new google.maps.Geocoder();

	nameToCoords(0);

	function nameToCoords(i) {
		if (i < dataHash.size()) {
			var h = dataHash[i];
			if (h.x === h.y && parseFloat(h.x) != h.x) {
				var name = h.x;
				if (geoCache[name]) {
					h.x = geoCache[name].x;
					h.y = geoCache[name].y;
					//console.log("used cache for "+name);
					nameToCoords(i+1);
				} else {
					console.log("looking lat/long for up "+name);
					geocoder.geocode({"address": name}, function(results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								var x = jsonPath(results, "*..location.Ja");
								var y = jsonPath(results, "*..location.Ka");
								if (x && y) {
									x = x.first(); y = y.first();
									geoCache[name] = { x: x, y: y };
									h.x = x; h.y = y;
								}
							} else {
								h.x = h.y = 0;
								console.log("google.maps.Geocoder error = "+status);
							}
							// throttle the geocode calls
							setTimeout(function(){ nameToCoords(i+1); }, 750);
						});
				}
			}
		} else {
			callback();
		}
	}
}



/** DEPRECATED */
/* traverse (any) json object to find nodes of a particular type */
function nodeFromArray(objects, catchString) {
    for (var i = 0; i < objects.length; i++) {
	if (eval('objects[i].'+catchString)) { return objects[i];}
    }
}


/* nd_json utility methods */

/* find values within json object */
/* uses fairly standard string notation "objectOne->objectTwo:methodOfSelection";
   the method of selection should return a single node, if not the first matching node will be returned.
   if no selection method is provided, should be a single value, NOT array
   the array will be built with one value per nd_experiment object (to be changed to sample object when data allows)  */ 

/** DEPRECATED */
function findVals (valString, data) {
    //   alert(valString)
  var objectPath = valString.split("->");
  catchString = "data.stocks";
  for (var i=0; i<objectPath.length;i++) {
    var gets = objectPath[i].split(':');
    var objectType = gets[0]; var predicate = gets[1];
//    alert("object = "+objectType+" predicate = "+predicate);
    if(predicate != undefined)
      catchString = catchString.concat(".collect(function(d) {return nodeFromArray(d.",objectType,",\"",predicate,"\")})");
    else
      catchString = catchString.concat(".collect(function(d) {return d.",objectType,"})");
  }
//  alert(catchString);
  var myVals = eval(catchString);
//  alert(myVals.length+"\n"+myVals);
  return myVals;
}

/* make 3-dim data structure for plotting */
/* to be replaced with getDataHash_map method (i.e. separate position grid from value grid - only used foor scatter plot jittering */
/** DEPRECATED */
function getDataHash (x, xvals, y, yvals, z, zvals) {
  var valHash = new Hash();
  valHash.set("X",xvals);
  valHash.set("Y",yvals);
  valHash.set("Z",zvals);
  
  var dataHash = data.stocks.map(function(d,i) {
      var xval = this.get("X")[i];
      var yval = this.get("Y")[i];
      var zval = this.get("Z")[i];
      return {x: xval, xpos: x(xval), 
	  y: yval, ypos: y(yval),
	  z: zval, zpos: z(zval)
	  }},valHash);
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}

/* make 3-dim data structure for plotting */
/*
function getDataLinks (xvals, y, data) {
  var valHash = new Hash();
  valHash.set("X",xvals);
  valHash.set("Y",yvals);
  valHash.set("Z",zvals);
 
  //  alert(x+" "+y+" "+z); 

  var dataHash = data.experiments.map(function(d,i) {
      var xval = this.get("X")[i];
      var yval = this.get("Y")[i];
      var zval = this.get("Z")[i];
      return {x: xval, xpos: x(xval), 
	  y: yval, ypos: y(yval),
	  z: zval, zpos: z(zval),
	  }},valHash);
  
  dataHash.sortBy(function(d) {return Number(d.y)});
  return dataHash;
}
*/

