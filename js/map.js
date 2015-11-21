function map() {
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", move);

    var mapDiv = $("#map");

    var width = mapDiv.width(),
        height = mapDiv.height();

    // initializing a default visualization type
    var visualizationType = 'block';

    // initialize color scale using the colors representing the parties
    var color = {
        'Moderaterna': '#52BDEC',
        'Centerpartiet': '#016A3A',
        'Folkpartiet': '#0094D7',
        'Kristdemokraterna': '#073192',
        'Miljöpartiet': '#53A045',
        'Socialdemokraterna': '#ED1B34',
        'Vänsterpartiet': '#DA291C',
        'Sverigedemokraterna': '#e5dd44',
        'övriga partier': '#777777',
        'Alliansen': '#52BDEC',
        'Rödgröna': '#ED1B34'
    };
    
    // initialize array for the alliance and redgreen blocks
    var alliance = ['Moderaterna', 'Centerpartiet', 'Folkpartiet', 'Kristdemokraterna'];
    var redgreen = ['Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet'];
    
    // Initialize variables
    var mapData,
        dataSet;
    
    //initialize tooltip
    var tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")               
        .style("opacity", 0);

    var projection = d3.geo.mercator()
        .center([30, 63])
        .scale(1000);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    var path = d3.geo.path()
        .projection(projection);

    var g = svg.append("g");

    // load data and draw the map
    d3.json("data/swe_mun.topojson", function(error, sweden) {
        mapData = topojson.feature(sweden, sweden.objects.swe_mun).features;

        //load summary data
        d3.csv("data/Swedish_Election_2010.csv", function(error, data) {
            draw(mapData, data);
            dataSet = data;
        });

    });

    /**
     * Draw the map
     * @param {array} municipalities Array of objects for all the municipalities in the map data
     * @param {array} data Array of objects representing the election data
     * @returns {undefined}
     */
    function draw(municipalities,data) {
        
        var temp = calcDistribution(data);
        
        var mc = temp[0],
            tooltip = temp[1],
            legendLabels = temp[2];
        
        // Remove any previous selection to allow changing of content on-the-fly
        g.selectAll(".municipality").remove();
        
        var municipality = g.selectAll(".municipality").data(municipalities);

        municipality.enter().insert("path")
            .attr("class", "municipality")
            .attr("d", path)
            .attr("id", function(d) { return d.id; })
            .attr("title", function(d) { return d.properties.name; })

            // color each municipality with the color for the most voted
            .style("fill", function(d) { return mc[d.properties.name]; })
            // display tooltip when hovering a municipality
            .on("mousemove", function(d) {
//                d3.select(this).transition().duration(300).style("opacity", 1);
                tooltipDiv.transition().duration(200).style("opacity", 1);
                tooltipDiv.html(function(e) {
                    return generateTooltip(tooltip, d.properties.name, visualizationType);
                })
                .style("left", (d3.event.pageX - 40) + "px")
                .style("bottom", (6*height/5 - d3.event.pageY) + "px");
            })
            .on("mouseout", function(d) {
//                d3.select(this).transition().duration(300);
                tooltipDiv.transition().duration(100).style("opacity",0);
            })
            //selection
            .on("click", function(d) {
                star.drawStar(d.properties.name, false);
                $("#compare").removeAttr("disabled");
            });
            
            // Add legends
            addLegend(svg, height, color, legendLabels);
            
            municipality.exit().remove();
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
     * Calculate the election distribution for each municipality
     * @param {object} data The dataset
     * @param {object} mc The municipality color object
     * @returns {object} Object connecting municipalities with colors
     */
    function calcDistribution(data, mc) {
        var max = 0,
            counter = 0,
            allianceSum = 0,
            redgreenSum = 0,
            municipalityIterator = 1,
            party = '',
            region = '',
            tooltip = [],
            legendLabels = [],
            municipalities = {},
            mc = {};
    
        //initialize a color municipality object
        data.forEach(function(d) {
            if (d['party'] !== 'ogiltiga valsedlar' && d['party'] !== 'ej röstande') {
                if (visualizationType === 'party') {
                    if (+d["Year=2010"] > max) {
                        max = d["Year=2010"];
                        party = d["party"];
                    }
                    municipalities[d['party']] = d['Year=2010'];
                    if (counter === (8 + 11 * (municipalityIterator - 1))) {
                        municipalities['region'] = getRegionName(d['region']);
                        tooltip.push(municipalities);
                        municipalities = {};
                        municipalityIterator++;

                        if (legendLabels.indexOf(party) === -1) {
                            legendLabels.push(party);
                        }
                    }

                    // sort the legends in descending order to display them in ascending order
                    legendLabels.sort().reverse();
                    
                } else if (visualizationType === 'block') {
                    if (alliance.indexOf(d['party']) > -1) {
                        allianceSum += +d['Year=2010'];
                    } else if (redgreen.indexOf(d['party']) > -1) {
                        redgreenSum += +d['Year=2010'];
                    }
                    allianceSum = +allianceSum.toFixed(1);
                    redgreenSum = +redgreenSum.toFixed(1);
                    
                    if (+allianceSum >= +redgreenSum) {
                        party = 'Alliansen';
                    } else {
                        party = 'Rödgröna';
                    }
                    if (counter === (8 + 11 * (municipalityIterator - 1))) {
                        tooltip.push({region: getRegionName(d['region']), 'Alliansen': allianceSum, 'Rödgröna': redgreenSum});
                        municipalityIterator++;
                    }
                    legendLabels = ['Rödgröna', 'Alliansen'];
                }
            }
            region = d['region'];
            mc[getRegionName(region)] = color[party];
            
            // Reset the max and sum values and increase
            if ((++counter % 11) === 0) {
                max = 0;
                allianceSum = 0;
                redgreenSum = 0;
            }
        });
        
        return [mc, tooltip, legendLabels];
    }
    
    /**
     * Generate the text to be shown in the tooltip on mouseover
     * @param {Array} objects Array with the distibution for the blocks
     * @param {String} region The municipality accessed by the mouse event
     * @param {String} distribution The type of distribution
     * @returns {String} The tooltip
     */
    function generateTooltip(objects, region, distribution) {        
        var tooltip = '<table><tr><th colspan="3">' + region + '</th></tr>';
        var found = false;
        var objectsSorted = [];
        for (key in objects) {
            if (objects[key]['region'] === region) {
                if (distribution === 'party') {
                    for (property in objects[key]) {
                        if (objects[key].hasOwnProperty(property)) {
                            objectsSorted.push({ 'key': property, 'value': objects[key][property]});
                        }
                    }
                    objectsSorted.sort(function(a, b) { return b.value - a.value; });
                    
                    for (key in objectsSorted) {
                        if (objectsSorted[key]['key'] !== 'region') {
                            tooltip += '<tr><td>' + objectsSorted[key]['key'] + ': </td><td>' + objectsSorted[key]['value'] + '%</td></tr>';
                        }
                    }
                    
                } else if (distribution === 'block') {
                    if (+objects[key]['Alliansen'] >= +objects[key]['Rödgröna']) {
                        tooltip += '<tr><td>Alliansen: </td><td>' + objects[key]['Alliansen'] + '%</td></tr>';
                        tooltip += '<tr><td>Rödgröna: </td><td>' + objects[key]['Rödgröna'] + '%</td></tr>';
                    } else {
                        tooltip += '<tr><td>Rödgröna: </td><td>' + objects[key]['Rödgröna'] + '%</td></tr>';
                        tooltip += '<tr><td>Alliansen: </td><td>' + objects[key]['Alliansen'] + '%</td></tr>';
                    }
                }
                found = true;
            }
            if (found) {
                break;
            }
        }
        tooltip += '</table>';
        return tooltip;
    }
    
    /**
     * Redraw the map with a different setting
     * @param {element} element the element that was pressed
     * @returns {undefined}
     */
    this.refresh = function(element) {
        if (element.innerHTML === 'Blockfördelning') {
            $('#blockBtn').attr("class", "active");
            $('#partyBtn').removeAttr("class", "active");
            visualizationType = 'block';
            draw(mapData, dataSet);
        } else if (element.innerHTML === 'Partifördelning') {
            $('#partyBtn').attr("class", "active");
            $('#blockBtn').removeAttr("class", "active");
            visualizationType = 'party';
            draw(mapData, dataSet);
        }
    };
    
    //method for selecting features of other components
    function selFeature(value) {
        //...
    }
}
