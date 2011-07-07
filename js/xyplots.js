/**
 * A dotplot, able to be jittered & split by cats.
 *
 * @param dataHash / div
 */
function dotplot(data, div, args) {
//    var w = 500; var h=400;
    var w = getDivWidth(div);
    var h = getDivHeight(div);
//    var w = div.style.width.replace("px","") || 500;
//    var h = div.style.height.replace("px","") || 500;

   
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
/*
  var xvals = findVals(xstring, data);
  var yvals = findVals(ystring, data);
  var zvals = findVals(zstring, data);

  var x = getScale(xvals, w);
  var y = getScale(yvals, h);
  var z = pv.Colors.category20(); //, s = x.range().band / 2;

  var dataMap = getDataHash(x, xvals, y, yvals, z, zvals);

*/
  var xvals = data.collect(function(d) {return d.x});
  var yvals = data.collect(function(d) {return d.y});
  var zvals = data.collect(function(d) {return d.z});
  var xType; var yType;
  
  var legendSize = estLegendSize(zvals);
  if(args) { xType = args.xscale; yType = args.yscale;}
  var x = getScale(xvals, (w-legendSize), xType);
  var y = getScale(yvals, h, yType);
  var z = pv.Colors.category20(); //, s = x.range().band / 2;
  data = addPosnsToHash(data,x,y);


  /* Make root panel. */
  var vis = new pv.Panel().canvas(div.id)
    .width(w)
    .height(h)
    .bottom(30)
    .left(30)
    .right(10)
    .top(5);

  legendPanel = vis.add(pv.Panel)
      .right(0)
      .width(legendSize)
;

  dataPanel = vis.add(pv.Panel)
      .width(w-legendSize)
      .left(0)
      //  .data(data)
      ;

//  setXAxis(xvals, x, dataPanel);
  addAxis(dataPanel, xvals, x, "bottom", xType);
//  setYAxis(yvals, y, dataPanel);
  addAxis(dataPanel, yvals, y, "left", yType);
  
  
  if(args && args.jitter=="true") {
      data = jitter(data, 10);
  }

  /* The dot plot! */
  dots = dataPanel.add(pv.Dot)
      .data(data)
    .bottom(function(d) {return d.ypos})
    .left(function(d) {return d.xpos})
    .strokeStyle(function(d) {return z(d.z)})
    ;
  
  addLegend(legendPanel, zvals, z);

  vis.render();
  return vis;   
}

/**
 * add xy posns to hash (for jittering, or similar)
 *
 * @param dataHash / x,y scales
 */

function addPosnsToHash(data, x,y) {
  
  var dataHash = data.map(function(d,i) {
      return {x: this[i].x, xpos: x(this[i].x), 
	  y: this[i].y, ypos: y(this[i].y),
	      z: this[i].z,
	  o: this[i].o}},data);

//  console.log(Object.toJSON(dataHash[0]));
  return dataHash;
}

/**
 * jitter function for dotplot
 *
 * @param dataHash / div
 */

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


/**
 * grouped bar chart
 *
 * @param dataHash / div
 */
function groupedBarChart(data, div,args) {
    var w = getDivWidth(div);
    var h = getDivHeight(div);

//    var w = div.style.width.replace("px","") || 500;
//    var h = div.style.height.replace("px","") || 500;
//    var args = args.evalJSON();

//    console.log(Object.toJSON(args));


  function setXAxis(scaleVals, scale, vis) {
    // nb - find way to check scale type from scale?
    vis.add(pv.Rule).data(scaleVals)
      .strokeStyle(function(d) {return d ? "#eee" : "#000"})
      .left(scale).anchor("bottom").add(pv.Label);
    return vis;
  }

  function setYAxis(scaleVals, scale, vis) {

//    else { // linear axis and ticks.
      vis.add(pv.Rule).data(scale.ticks())
	.strokeStyle(function(d) {return d ? "#eee" : "#000"})
	.bottom(scale).anchor("left")
	.add(pv.Label).text(y.tickFormat);
//    }  
    return vis;
  }



  /* create data */

  var xvals = data.collect(function(d) {return d.x});
  var yvals = data.collect(function(d) {return d.y});
  var zvals = data.collect(function(d) {return d.z});
  var n = xvals.length;
 
  var xType; var yType="linear";

 if(args) { xType = args.xscale; yType = args.yscale || yType;}
  var x = pv.Scale.ordinal(pv.range(n)).splitBanded(0, w, 9/10);
  var y = getScale(yvals, h, yType);
  var z = pv.Colors.category20(); //, s = x.range().band / 2;


  /* Make root panel. */
  var vis = new pv.Panel().canvas(div.id)
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
    
    dataMapSub = data.findAll(function (d) {return d.x == uxvals[i];});

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
  vis.render();  
  return vis;   
}

function getScale(scaleVals, sz, type) {
    var s;
    var min = scaleVals.collect(function(d) {return Number(d)}).min();
    if(min > 0) {min=0;}
    var max = scaleVals.collect(function(d) {return Number(d)}).max();
    if(max <=0) {max = 0;}

    if(type=="ordinal") {
	s = pv.Scale.ordinal(scaleVals.uniq().sort()).split(0, sz);}
    else if (type=="linear") {
	s = pv.Scale.linear(min, max).range(0, sz).nice();}
    else if (type=="log" || type=="logarythmic") {
	s = pv.Scale.log(min, max).range(0, sz).nice();}
    else {
	s = guessScale(scaleVals,sz);
    }
    return s;
}


/**
 * if no scale is given, guess based on presence / absence of numbers
 */
function guessScale(scaleVals, sz) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;
    var min = scaleVals.collect(function(d) {return Number(d)}).min();
    if(min > 0) {min=0;}
    var max = scaleVals.collect(function(d) {return Number(d)}).max();
    if(max <=0) {max = 0;}

    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))}))
	s = pv.Scale.ordinal(scaleVals.uniq().sort()).split(0, sz);
    else
	s = pv.Scale.linear(min, max).range(0, sz).nice();    
    return s;
}

function addAxis(panel, scaleVals, scale, anchor, type) {
    var rule;
    // if no type guess based on numbers
    console.log(type);
    if(!type) {
	var numreg=/(^\d+$)|(^\d+\.\d+$)/;   
	if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))})) {
	    type = "ordinal";
	}
	else {
	    type = "linear";
	} 
    }
    console.log(type);

    if(type=="ordinal") {
	rule = panel.add(pv.Rule).data(scaleVals.uniq())
	    .strokeStyle(function(d) {return d ? "#eee" : "#000"})
//	    .left(scale).anchor(anchor)
//	    .add(pv.Label);
	if(anchor == "bottom") {
	    rule.left(scale).anchor(anchor).add(pv.Label);
	}
	else if (anchor == "left") {
	    rule.bottom(scale).anchor(anchor).add(pv.Label);
	}
    }
    else if (type=="linear") {
	rule = panel.add(pv.Rule).data(scale.ticks())
	    .strokeStyle(function(d) {return d ? "#eee" : "#000"})
//	    .left(scale).anchor(anchor)
//	    .add(pv.Label).text(scale.tickFormat);
	if(anchor == "bottom") {
	    rule.left(scale)
	        .anchor(anchor)
	        .add(pv.Label)
	        .text(scale.tickFormat);
	}
	else if (anchor == "left") {
	    rule.bottom(scale)
		.anchor(anchor)
		.add(pv.Label)
		.text(scale.tickFormat);
	}
    }
/*    else {
	guessAxis(panel,scaleVals,scale,anchor);
    }
*/  
}


/**
 * if no scale is given, guess based on presence / absence of numbers
 */
function guessAxis(panel, scaleVals, scale, anchor) {
    var numreg=/(^\d+$)|(^\d+\.\d+$)/;   
    if(scaleVals.uniq().any(function(d) {return (!numreg.test(d))})) {
	addAxis(panel, scaleVals, scale, anchor, "linear");
    }
    else {
	addAxis(panel, scaleVals, scale, anchor, "ordinal");	
    }
}
