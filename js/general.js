/**
 * Remove the municipality code from the region
 * @param {string} region The region to remove the code from
 * @returns {string} The name of the region
 */
function getRegionName(region) {
    return region.substr(region.indexOf(' ') + 1);
}


/**
 * Add a legend to the map showing the parties/blocks/regions represented
 * @param {type} svg
 * @param {type} height
 * @param {type} color
 * @param {type} labels
 * @returns {addLegend.legend}
 */
function addLegend(svg, height, color, labels) {
    // Remove any previous selection to allow changing of content on-the-fly
    svg.selectAll("g.legend").remove();

    // Set width of label color
    var ls_w = 20,
        ls_h = 20;

    var legend = svg.selectAll("g.legend")
                .data(labels)
                .enter().append("g")
                .attr("class", "legend");

    // Add square representing the party/block color
    legend.append("rect")
            .attr("x", 10)
            .attr("y", function(d, i) { return height - (i * ls_h) - 2 * ls_h - 20; } )
            .attr("width", ls_w)
            .attr("height", ls_h)
            .style("fill", function(d, i) { 
                if (typeof color === 'object') { return color[d]; } 
                else { return color(i); }
            })
            .style("opacity", 0.8);

    // Add text to the legend
    legend.append("text")
            .attr("x", 40)
            .attr("y", function(d, i) { return height - (i * ls_h) - ls_h - 4 - 20; } )
            .attr("fill", "#737373")
            .text(function(d, i) { return labels[i]; });

    return legend;
}