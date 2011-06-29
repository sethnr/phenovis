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

