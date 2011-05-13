/* traverse (any) json object to find nodes of a particular type */
function nodeFromArray(objects, catchString) {
    for (var i = 0; i < objects.length; i++) {
	if (eval('objects[i].'+catchString)) { return objects[i];}
    }
}


function jitter(data, space) {
  var d = data;
  var s = space;
  var max = d.length - 1;
  var cfDist = [Math.round(d.length / 20),1].max();

  function push(i, direction) {
    var m = i > d.length / 2 ? d.length - i : i; //distance to nearest end
    var start_i = i;
    var _i = i + direction; //always compare to neighbour first
    var x = 0; // no of iterations
    var cc = false;

    while(x <= m) { //for x iterations

      if(i >= 0 && i <= max && _i >= 0 && _i <= max) { //as long as i/_i in range

	var hyp = dist(d[_i], d[i]);
	var theta = dir(d[_i], d[i]);
	if (hyp < s) { // If the difference is to small
	  var diff = (s - hyp) / 2;
	  var ytrans = 0;
	  var xtrans = diff;
	  
	  /* add vertical jitter if overlaid dots on same x axis */
	  if((d[_i].y == d[i].y) && (d[_i].xpos == d[i].xpos)) {
	    theta = (direction * (Math.PI / 4));
	    //	    theta = Math.random()*(2*Math.PI);
	    ytrans = diff * Math.sin(theta);
	    xtrans = diff * Math.cos(theta);
	  }
	  //	  alert("hyp = "+hyp+" theta = "+theta+"\nxtr = "+xtrans+" ytrans = "+ytrans);
	  d[_i].xpos = d[_i].xpos + (xtrans * direction);
	  d[i].xpos = d[i].xpos + (xtrans * -1 * direction); // Move both points equally away.
	  d[_i].ypos = d[_i].ypos + (ytrans * direction);
	  d[i].ypos = d[i].ypos + (ytrans * -1 * direction); // Move both points equally away.
	  

	  if (diff >= 1) // Prevents infinite loops. if diffs > 1, stop
	    cc = true;
	}
      }
      _i += (direction * Math.round(Math.random()*cfDist)); //compare to random node, no further than cfDist away
      //i += direction;
      //_i += direction;
      x++;
    }
    return cc;
  }
  
  /* calc euclid distance */
  function dist (a, b) {
    return Math.sqrt(Math.pow(Math.abs(a.ypos - b.ypos),2) + 
		     Math.pow(Math.abs(a.xpos - b.xpos),2));
  }

  /* calc tan direction */
  function dir (a, b) {
    return Math.atan2((a.ypos - b.ypos),(a.xpos - b.xpos));
  }
 
  // prevents endless push back-and-forth
  var iterations = 0;
  var maxIterations = d.length; 
  do {
    var overlaid = false;
    // For each data point in the array, push, if necessary, that data point
    // and it's surrounding data points away.
    for(var i = 1; i < d.length -1; ++i) {   
	var o = push(i, -1);
	overlaid = overlaid || o;
	o = push(i, 1);
	overlaid = overlaid || o;
      }
    iterations++;
  } while(overlaid && iterations < maxIterations);  
  return d;
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
	  z: zval, zpos: z(zval),
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


/* dot plot */

function dotplot(data, w, h, xstring, ystring, zstring) {
  
  function getScale(scaleVals, sz) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))}))
      s = pv.Scale.ordinal(scaleVals.uniq()).split(0, sz);
    else
	s = pv.Scale.linear(0, scaleVals.collect(function(d) {return Number(d)}).max()).range(0, sz).nice();
    return s;
  }
  
  function setXAxis(scaleVals, scale, vis) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    // nb - find way to check scale type from scale?
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))})) { // ordinal axis and ticks.
      vis.add(pv.Rule).data(scaleVals.uniq())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.left(scale).anchor("bottom").add(pv.Label);
    }
    else {  // linear axis and ticks.
      vis.add(pv.Rule).data(scale.ticks())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.left(scale).anchor("bottom")
	.add(pv.Label).text(scale.tickFormat);
    }  
    return vis;
  }

  function setYAxis(scaleVals, scale, vis) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))})) { // ordinal axis and ticks.
      vis.add(pv.Rule).data(scaleVals.uniq())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.bottom(scale).anchor("left").add(pv.Label);
    }
    else { // linear axis and ticks.
      vis.add(pv.Rule).data(scale.ticks())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.bottom(scale).anchor("left")
	.add(pv.Label).text(y.tickFormat);
    }  
    return vis;
  }



  /* create data */
  var xvals = findVals(xstring, data);
  var yvals = findVals(ystring, data);
  var zvals = findVals(zstring, data);

  var x = getScale(xvals, w);
  var y = getScale(yvals, h);
  var z = pv.Colors.category10(); //, s = x.range().band / 2;

  var dataMap = getDataHash(x, xvals, y, yvals, z, zvals);


  /* Make root panel. */
  var vis = new pv.Panel()
    .width(w)
    .height(h)
    .bottom(30)
    .left(30)
    .right(10)
    .top(5);

  setXAxis(xvals, x, vis);
  setYAxis(yvals, y, vis);



  /* The dot plot! */
  panel = vis.add(pv.Panel)
    .data(jitter(dataMap, 10))
    ;
  
  dots = panel.add(pv.Dot)
    .bottom(function(d) {return d.ypos})
    .left(function(d) {return d.xpos})
    .strokeStyle(function(d) {return z(d.z)})
    ;
  
  return vis;   
}





/* grouped bar chart */
function groupedBarChart(data, w, h, xstring, ystring, zstring) {
  
  function getScale(scaleVals, sz) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))}))
      s = pv.Scale.ordinal(scaleVals.uniq()).split(0, sz);
    else
      s = pv.Scale.linear(0, scaleVals.collect(function(d) {return Number(d)}).max()).range(0, sz).nice();    
    return s;
  }
  
  function setXAxis(scaleVals, scale, vis) {
    // nb - find way to check scale type from scale?
    vis.add(pv.Rule).data(scaleVals)
      .strokeStyle(function(d) {return d ? "#eee" : "#000"})
      .left(scale).anchor("bottom").add(pv.Label);
    return vis;
  }

  function setYAxis(scaleVals, scale, vis) {
/*
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))})) { // ordinal axis and ticks.
      vis.add(pv.Rule).data(scaleVals.uniq())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.bottom(scale).anchor("left").add(pv.Label);
    }
*/
//    else { // linear axis and ticks.
      vis.add(pv.Rule).data(scale.ticks())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.bottom(scale).anchor("left")
	.add(pv.Label).text(y.tickFormat);
//    }  
    return vis;
  }



  /* create data */
  var xvals = findVals(xstring, data);
  var yvals = findVals(ystring, data);
  var zvals = findVals(zstring, data);

  var n = xvals.length;

  var x = pv.Scale.ordinal(pv.range(n)).splitBanded(0, w, 9/10);
  var y = getScale(yvals, h);
  var z = pv.Colors.category19(); //, s = x.range().band / 2;

  var dataMap = getDataHash(x, xvals, y, yvals, z, zvals);

  /* Make root panel. */
  var vis = new pv.Panel()
    .width(w)
    .height(h)
    .bottom(40)
    .left(30)
    .right(10)
    .top(5);


  setYAxis(yvals, y, vis);

  var left = 0;
  var bw = w / xvals.length;
  var uxvals = xvals.uniq().sort();

  for (var i = 0; i<uxvals.length; i++) {
    //add new panel of width (newHash.length * colwidth) 
    
    dataMapSub = dataMap.findAll(function (d) {return d.x == uxvals[i];});

    var catdiv = vis.add(pv.Panel)
	.width(dataMapSub.length * bw)
	.left(left)
	.width(bw * dataMapSub.length)
	;
    catdiv
	.anchor("bottom").add(pv.Label)
	.textMargin(25)
	.textBaseline("top")
	.text(uxvals[i])
	;
    left = left + (bw * dataMapSub.length);

    
    var bar = catdiv.add(pv.Bar)
	.data(dataMapSub)
	.left(function() {return x(this.index)})
	.width(x.range().band)
	.bottom(0)
	.height(function(d) {return y(d.y)})
	.fillStyle(function(d) {return z(d.x)})
	;
 
    bar.anchor("top").add(pv.Label)
	.textStyle("white")
	.text(function(d) {return d.y;});
    
    bar.anchor("bottom").add(pv.Label)
	.textMargin(5)
	.textStyle(function(d) {return d ? "#aaa" : "#000"})
	.textBaseline("top")
	.text(function(d) {return d.z});
 
      }
    
  return vis;   
}


function frequencyMatrix(data, w, h, xstring, ystring, zstring) {
    /* create data */
    var xvals = findVals(xstring, data);
    var yvals = findVals(ystring, data);

    var zmax = 1;

    dataHash = new Array();

    if(zstring == undefined) {
      
	var valHash = new Hash();
	valHash.set("X",xvals);
	valHash.set("Y",yvals);

	var xvalsU = xvals.uniq().sort();
	var yvalsU = yvals.uniq().sort();

	tempHash = data.experiments.map(function(d,i) {
		var xval = this.get("X")[i];
		var yval = this.get("Y")[i];
		return {X: xval, 
			Y: yval,
			}},valHash);

	data.experiments.each(function(d,i) {
	    var xval = this[i].X; var xi = xvalsU.indexOf(xval);
	    var yval = this[i].Y; var yi = yvalsU.indexOf(yval);

	    var datum = dataHash.find(function(d) {return (d.sourceName == xval && d.targetName == yval)});
	    (datum != undefined)? datum.value++: 
		
		  dataHash.push({source: xi, 
			target: yi,
			sourceName: xval,
			targetName: yval,
			value: 1});

		/*		alert(dataHash.length+" \n"+
		      dataHash.find(function(d) {return (d.source == xval && d.target == yval)}).source+" "+
		      dataHash.find(function(d) {return (d.source == xval && d.target == yval)}).target+" "+
		      dataHash.find(function(d) {return (d.source == xval && d.target == yval)}).value+" "
		      );
		*/
	  }
	  ,tempHash);
	dataHash.each(function(d) {if(d.value > zmax) {zmax = d.value;}});
    }
    else {
	var zvals = findVals(zstring, data);
	zmax = zvals.max();
	var valHash = new Hash();
	valHash.set("X",xvals);
	valHash.set("Y",yvals);
	valHash.set("Z",zvals);
	dataHash = data.experiments.map(function(d,i) {
		var xval = this.get("X")[i];
		var yval = this.get("Y")[i];
		var zval = this.get("Z")[i];
		return {source: xval, 
			target: yval,
			value: zval,
			}},valHash);
    }
    

    var c = pv.Scale.linear(0, zmax).range("white","red");

    var vis = new pv.Panel()
	.width(w)
	.height(h)
	.top(100)
	.left(100);

    var dir = false;

    var layout = vis.add(pv.Layout.Matrix).directed(dir)
//    var layout = vis.add(pv.Layout.Arc)
//    var layout = vis.add(pv.Layout.Force)
      .nodes(xvals.uniq().sort())
	.links(dataHash)
        .sort(function(a, b) {return b.name - a.name})
      ;
    
    layout.link.add(pv.Bar)
	.fillStyle(function(l) {return c(l.linkValue/(dir?1:2));})
	.antialias(false)
	.lineWidth(1);

    layout.label.add(pv.Label)
      //	.textStyle(color)
      ;
    return vis;
}


