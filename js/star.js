function star() {
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", move);

    var starDiv = $("#star");
    
    var width = starDiv.width(),
        height = starDiv.height();
    
    // Initialize color scale
    var color = d3.scale.category10();
    
    var radians = 2 * Math.PI,
        nrOfAxes = 0,
        factor = 0.6,
        starFactor = 0.58,
        maxValue = 0.6;
    
    var municipalities = [],
        axes = [];
    
    var svg = d3.select("#star").append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(zoom);

    var g = svg.append("g")
            .attr("x", 0)
            .attr("y", 0);

    // load data and draw the star
    d3.csv("data/Swedish_Election_2010.csv", function(error, data) {
        draw(data);
    });
    
    /**
     * Draw the radar chart upon which the star will be visualized
     * @param {type} data the data from the dataset
     * @returns {undefined}
     */
    function draw(data) {
        height = height > width ? width : height;
        width = width > height ? height : width;
        
        municipalities = getData(data);
        
        addAxes(axes);
    }
    /**
     * Initialize zooming and panning functionality for the map
     * @returns {undefined}
     */
    function move() {
        var t = d3.event.translate;
        var s = d3.event.scale;
        
        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
    }
    /**
     * Initialize zooming and panning functionality for the map
     * @returns {undefined}
     */
    function move() {
        var t = d3.event.translate;
        var s = d3.event.scale;
        
        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
    }
    
    /**
     * Get the data we need in the format we want
     * @param {Array} data - the data from the dataset
     * @returns {Array} The municipalities and their election distribution
     */
    function getData(data) {
        var counter = 0,
            municipalities = [],
            object = {};
    
        // Reading and taking out the data we need
        data.forEach(function(d, i) {
            if (d['party'] !== 'ogiltiga valsedlar' && d['party'] !== 'ej röstande') {
                object[d['party']] = (+d['Year=2010']/100);
                
                // Add only the 9 different parties to an array, axes, for showing on the radar chart
                if (i < 9) {
                    axes.push(d['party']);
                }
            }
            // Add information for the current municipality and empty the object for the next municipality
            if ((++counter % 11) === 0) {
                municipalities[getRegionName(d["region"])] = object;
                object = {};
            }
        });
        nrOfAxes = axes.length;
        
        return municipalities;
    }
    
    function getPosition(i, range, factor, func){
        factor = typeof factor !== 'undefined' ? factor : 1;
        return range * (1 - factor * func(i * radians / nrOfAxes));
    }
    function getHorizontalPosition(i, range, factor){
        return getPosition(i, range, factor, Math.sin);
    }
    function getVerticalPosition(i, range, factor){
        return getPosition(i, range, factor, Math.cos);
    }
    
     /**
     * Add axes to the plot
     * @param {type} axes
     * @returns {star.addAxes.axis}
     */
    function addAxes(axes) {
        var axis = g.selectAll(".axis").data(axes).enter().append("g").attr("class", "axis");
        
        axis.append("line")
            .attr("class", "line")
            .attr("x1", width/2)
            .attr("y1", height/2)
            .attr("x2", function(j, i) { return getHorizontalPosition(i, width/2, factor); })
            .attr("y2", function(j, i) { return getVerticalPosition(i, height/2, factor); })
            .style("stroke", "grey")
            .style("stroke-width", "1px");
    
        axis.append("text")
            .text(function(d) { return d; })
            .attr("fill", "#737373")
            .attr("text-anchor", "middle")
            .attr("x", function(d, i) { return width/2 * (1-factor*Math.sin(i*radians/nrOfAxes))-60*Math.sin(i*radians/nrOfAxes);})
            .attr("y", function(d, i) { return height/2 * (1-factor*Math.cos(i*radians/nrOfAxes))-20*Math.cos(i*radians/nrOfAxes);});
    
        addCircles(axis);
        return axis;
    }
    
    function addCircles(axis) {
        var padding = {
            top: 10,
            right: 0,
            bottom: 15,
            left: 0
        };
        var heightCircleConstraint = height - padding.top - padding.bottom;
        var widthCircleConstraint = width - padding.left - padding.right;
        var circleConstraint = d3.min([heightCircleConstraint*0.65/2, widthCircleConstraint*0.65/2]);
        var radius = d3.scale.linear().domain([0, 0.65]).range([0, circleConstraint]);
        var nrOfTicks = radius.ticks(5);

        circleAxes = axis.select('.circle-ticks')
            .data(nrOfTicks)
            .enter().append('svg:g')
            .attr("class", "circle-ticks");

        circleAxes.append("svg:circle")
            .attr("r", function (d, i) {
                return radius(d);
            })
            .attr("class", "circle")
            .style("stroke", "#CCC")
            .style("opacity", 0.5)
            .style("fill", "none");
    
        circleAxes.attr("transform",
            "translate(" + width/2 + ", " + height/2 + ")");

        circleAxes.append("svg:text")
            .attr("x", function(d){ return 3-factor*Math.sin(0); })
            .attr("y", function(d){ return factor*Math.cos(0); })
            .style("opacity", 0.7)
            .attr("fill", "#737373")
            .attr("dy", function (d) {
                return -radius(d);
            })
            .text(function(d){
                return d*100 + "%";
            });
    }
    

    var compare = document.getElementById("compare");
    
    var series = 0,
        starOpacity = 0.2,
        currentMunicipality = "",
        legendLabels = [];
    
    /**
     * 
     * @param {type} municipality
     * @param {type} cluster
     * @returns {star.drawStar}
     */
    this.drawStar = function(municipality, cluster) {
        cluster = typeof cluster !== 'undefined' ? cluster : false;
        
        currentMunicipality = municipality;
        
        var pressed = municipalities[municipality];
    
        var dataValues = [],
            draw = true,
            i=0;
        
        if (compare.checked || cluster) {
            if (legendLabels.indexOf(municipality) === -1) {
                if (legendLabels.length >= 5) {
                    draw = false;
                } else {
                    legendLabels.push(municipality);
                }
            } else {
                draw = false;
            }
            series++;
        } else {
            legendLabels = [municipality];
            for (series; series > 0; series--) {        
                g.selectAll(".radar-chart-serie"+series).remove();
            }
        }

        for (var key in pressed) {
            dataValues.push([
                getHorizontalPosition(i, width/2, (parseFloat(Math.max(pressed[key], 0))/maxValue)*starFactor),
                getVerticalPosition(i, height/2, (parseFloat(Math.max(pressed[key], 0))/maxValue)*starFactor)]);
            i++;
        }
        if (draw) {
            g.selectAll(".radar-chart-serie"+series).remove();
            g.selectAll(".radar-chart-serie")
                .data([dataValues])
                .enter()
                .append("polygon")
                .attr("class", "radar-chart-serie"+series)
                .style("stroke-width", "1px")
                .style("stroke", color(series))
                .attr("points",function(d) {
                    var str="";
                    for(var pti=0;pti<d.length;pti++){
                        str=str+d[pti][0]+","+d[pti][1]+" ";
                    }
                    return str;
                 })
                .style("fill", color(series))
                .style("fill-opacity", starOpacity)
                .on('mouseover', function (d) {
                    z = "polygon."+d3.select(this).attr("class");
                    g.selectAll("polygon").transition(200).style("fill-opacity", 0.1);
                    g.selectAll(z).transition(200).style("fill-opacity", .7);
                })
                .on('mouseout', function(){
                    g.selectAll("polygon").transition(200).style("fill-opacity", starOpacity);
                });
        }
        
        addLegend(svg, height, color, legendLabels);
    };
    
    var allowCluster = true;
    
    this.cluster = function() {
        var v = municipalities[currentMunicipality];
        var threshold = 0.040,
            t = 0.0025,
            fin = [];
        do {
            fin = [];
            for (key in municipalities) {
                var array = [];
                var municipality = municipalities[key];
                var mun = key;
                if (mun !== 'Bara' && mun !== currentMunicipality) {
                    for (key in municipality) {
                        if (+municipality[key] >= (+v[key] + threshold) || +municipality[key] <= (+v[key] - threshold)) {
                            break;
                        } else {
                            array.push(key);
                        }
                    }
                    if (array.length === 9) {
                        fin.push(mun);
                    }
                }
            }
            threshold = threshold - t;
            threshold = threshold.toFixed(4);
        } while (fin.length > 3);
        
        if (allowCluster) {
            fin.forEach(function(d) {
                star.drawStar(d, true);
            });
            allowCluster = false;
        }
    };
    
    this.reset = function() {
        for (series; series >= 0; series--) {
            g.selectAll(".radar-chart-serie"+series).remove();
        }
        svg.selectAll("g.legend").remove();
        
        $("#compare").removeAttr("checked");
        $("#compare").attr("disabled", true);
        
        series = 0;
        allowCluster = true;
    };
}