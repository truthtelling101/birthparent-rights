// Set up dimensions
const width = 960;
const height = 600;

// Add title and subtitle first (these will show even if map fails)
d3.select('#map')
    .append('h1')
    .text('Revocation Periods by State');

d3.select('#map')
    .append('p')
    .text('Where new mothers\' rights are protected and where they are not.');

// Create SVG
const svg = d3.select('#map')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', '#fff'); // White background for the map

// Create a projection
const projection = d3.geoAlbersUsa()
    .scale(1300)
    .translate([width / 2, height / 2]);

// Create path generator
const path = d3.geoPath()
    .projection(projection);

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #C6176D") // Magenta border
    .style("border-radius", "4px")
    .style("padding", "10px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 5px rgba(0, 0, 0, 0.2)");

// Load both data files
Promise.all([
    d3.json('us-states.json'),
    d3.csv('revoperiods.csv')
]).then(function(data) {
    const [us, revocationData] = data;
    
    // Create a lookup for state data - USING CORRECT COLUMN NAMES FROM CSV
    const revocationByState = {};
    revocationData.forEach(d => {
        // Use "name" instead of "STATE"
        revocationByState[d.name.toUpperCase()] = {
            daysAfterBirth: d['revocationPeriod.daysAfterBirth'],
            specialCircumstances: d['revocationPeriod.specialCircumstances'],
            knowYourRightsText: d['knowyourrights.text'],
            knowYourRightsLink: d['knowyourrights.link']
        };
    });

    // Draw states with hover and click functionality
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "state")
        .style("fill", "#C6176D") // Main magenta color matching website
        .style("stroke", "#fff")
        .style("stroke-width", "0.5")
        .style("cursor", "pointer") // Change cursor to indicate clickable
        .on("click", function(event, d) {
            const stateName = d.properties.name.toUpperCase();
            const stateData = revocationByState[stateName];
            
            // Open the link in a new tab when state is clicked
            if (stateData && stateData.knowYourRightsLink) {
                window.open(stateData.knowYourRightsLink, '_blank');
            }
        })
        .on("mouseover", function(event, d) {
            const stateName = d.properties.name.toUpperCase();
            const stateData = revocationByState[stateName];
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            let content = `<strong>${d.properties.name}</strong><br/>`;
            if (stateData && stateData.daysAfterBirth) {
                // Check if days is 0, and if so, make it bold red
                const daysText = stateData.daysAfterBirth === "0" ? 
                    `<span style="color: red; font-weight: bold;">0</span>` : stateData.daysAfterBirth;
                
                content += `Revocation Period: ${daysText} days after birth<br/>`;
                if (stateData.specialCircumstances) {
                    content += `${stateData.specialCircumstances}<br/>`;
                }
                
                // Add the new Know Your Rights section with hyperlink
                if (stateData.knowYourRightsText && stateData.knowYourRightsLink) {
                    content += `<a href="${stateData.knowYourRightsLink}" target="_blank">${stateData.knowYourRightsText}</a>`;
                }
            } else {
                content += 'No data available';
            }
            
            tooltip.html(content)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
                
            d3.select(this).style("fill", "#9C135E"); // Darker magenta for hover state
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            
            d3.select(this).style("fill", "#C6176D"); // Return to original magenta
        });
});