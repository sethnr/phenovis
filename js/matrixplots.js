/**
 * cartesian matrix with block intensities controlled by z val
 * @param dataHash / div
 */
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
			Y: yval
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
			value: zval
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


