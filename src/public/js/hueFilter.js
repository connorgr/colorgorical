////////////////////////////////////////////////////////////////////////////////
// Hue filter selection
//
// NOTE: there are a couple of degree space variants in this file for hue.
//      1. Colorgorical hue angle -
//            Colorgorical hue follows conventional color hue diagrams where
//            0° is located what would typically be 90°CW with 0° facing "North"
//            This space goes CCW, not CW.
//      2. SVG angle -
//            This space has 0° start at cardinal North and goes CW.
//
// The mouse interaction were based heavily off of the tweening that Mike
//    Bostock presents in his block @ http://bl.ocks.org/mbostock/5100636

// Takes a hue degree angle range in hue angle degree coordinates and adds the
//    corresponding hue filter to the panel's list
function addHueFilterToPanel(low, high) {
  var li = d3.select('#hueFilterAddedPanel').append('li')
          .attr('data-hue-low', low)
          .attr('data-hue-high', high);
  li.append('i').attr('class', 'fa fa-trash-o')
      .on('click', function() {
          li.remove();
          var low = li.attr('data-hue-low'), high = li.attr('data-hue-high');
          d3.select('.color-hf-'+low.toString()+'-'+high.toString()).remove();
        });
  li.append('span').text(' ' + low + '° – ' + high + '°');
}

////////////////////////////////////////////////////////////////////////////////
// Hue arc donut rendering and interaction

// hfContainer is the panel GUI widget in Colorgorical
var hfContainer = d3.select('#hueFilterSelection'),
    hfWidth = 180,
    hsvg = hfContainer.append('svg') // hue filter svg
              .classed({'noSelect': true})
              .attr('width', hfWidth)
              .attr('height', hfWidth);
// Constants for hue arc calculation
var π = Math.PI,
    τ = 2 * π,
    n = 100;

var width = hfWidth,
    height = hfWidth,
    outerRadius = width / 2 - 20,
    innerRadius = outerRadius - 20;

function deg2rad(d) { return d*(Math.PI / 180);}
function rad2deg(d) { return d/(Math.PI / 180); }

// the hue arc donut's origin
var hueArcOrigin = [width/2, height/2];

// given a lightness value, compute the hue for d3.arc radian angle
//   the angle is the centroid of whatever hue arc wedge is being filled
function hueArcFillFn(chroma) {
  return function(d) {
    d = -(d - 90);
    return d3.hcl(d * 360 / τ, chroma, 60);
  };
}

var hueArcg = hsvg.append("g")
        .style('pointer-events', 'all')
        .attr("transform", "translate(" + width/2  + "," + height/2  + ")"),
    // create the hue arc donut that has fully-chromatic colors for all hues
    hueArcs = hueArcg.append('g'),
    hueArc9 = hueArcs.append('g'),
    hueArc8 = hueArcs.append('g'),
    hueArc7 = hueArcs.append('g'),
    hueArc6 = hueArcs.append('g'),
    hueArc5 = hueArcs.append('g'),
    hueArc4 = hueArcs.append('g'),
    hueArc3 = hueArcs.append('g'),
    hueArc2 = hueArcs.append('g'),
    hueArc1 = hueArcs.append('g'),
    // create an invisible overlay for capturing drag events
    ghostDonut = hueArcg.append('path')
        .attr('d', d3.svg.arc()
            .outerRadius(outerRadius)
            .innerRadius(innerRadius-40)
            .startAngle(0)
            .endAngle(360))
        .style('visibility', 'hidden');

var hueArcLabelTextStyle = {
  fill: 'rgb(221,221,221)',
  'font-size': 12
};
hueArcg.append('text')
    .style(hueArcLabelTextStyle)
    .attr('y', -outerRadius-3)
    .attr('transform', 'rotate(90)')
    .text('0°');
hueArcg.append('text')
    .style(hueArcLabelTextStyle)
    .attr('text-anchor', 'middle')
    .attr('y', -outerRadius-3)
    .text('90°');
hueArcg.append('text')
    .style(hueArcLabelTextStyle)
    .attr('text-anchor', 'middle')
    .attr('x', 0)
    .attr('y', -outerRadius-3)
    .attr('transform', 'rotate(-90)')
    .text('180°');
hueArcg.append('text')
    .style(hueArcLabelTextStyle)
    .attr('text-anchor', 'middle')
    .attr('y', outerRadius+1+12)
    .text('270°');

hueArc1.selectAll("path")
    .data(d3.range(0, τ, τ / n))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(100));

hueArc2.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius+5)
        .innerRadius(innerRadius-5)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(90));

hueArc3.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius)
        .innerRadius(innerRadius-10)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(80));

hueArc4.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-5)
        .innerRadius(innerRadius-15)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(70));

hueArc5.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-10)
        .innerRadius(innerRadius-20)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(60));

hueArc6.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-15)
        .innerRadius(innerRadius-25)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(50));

hueArc7.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-20)
        .innerRadius(innerRadius-30)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(40));

hueArc8.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-25)
        .innerRadius(innerRadius-35)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(30));

hueArc9.selectAll('path')
    .data(d3.range(0, τ, τ / (2*n)))
  .enter().append("path")
    .attr("d", d3.svg.arc()
        .outerRadius(innerRadius-30)
        .innerRadius(innerRadius-40)
        .startAngle(function(d) { return d; })
        .endAngle(function(d) { return d + τ / n * 1.1; }))
    .style("fill", hueArcFillFn(20));

// Start hue region selection drag behavior
var hueAreaSelectMarkers = hsvg.append('g')
    .attr('transform', 'translate('+width/2+','+height/2+')');
var hueRangeFilterArc = d3.svg.arc() // constructor for making hue selections
        .outerRadius(outerRadius+15)
        .innerRadius(outerRadius),
    hueMarker, // variable used for appending new hue selections to donut
    hueMarkerStartDragAngle; // needed to determine CW or CCW drag direction

// Change hueMarker angle on drag
function hueArcTween(transition, newAngle) {
  transition.attrTween('d', function(d) {
    var interpolate = d3.interpolate(d.endAngle, newAngle);
    return function(t) {
      d.endAngle = interpolate(t);
      return hueRangeFilterArc(d);
    };
  });
}


// convert an x,y point on the hue donut to the corresponding hue angle
function hueAnglePt(x,y) {
  var angle = Math.atan2(y,x)/(Math.PI / 180);
  // correct angle to start with circle
  var hueAngle = angle - 90;
  hueAngle = hueAngle < 0 ? 360 + hueAngle : hueAngle;

  return {svgAngle: angle, hueAngle: hueAngle};
}

// calculates the point following the vector defined by vector [x,y] given an
//    origin of [0,0] and a magnitude of outerRadius
var hueRegionLineStyle = {
  stroke: 'rgba(0,0,0,0.5)',
  'stroke-width': 1
};
function hueLineEndPt(x,y) {
  var v_a = [0,0],
      v_b = [x,y],
      v_ba = [v_b[0]-v_a[0], v_b[1]-v_a[1]],
      v_ba_distance = Math.sqrt(v_ba[0]*v_ba[0] + v_ba[1]*v_ba[1]),
      u_ba = [ v_ba[0] / v_ba_distance, v_ba[1] / v_ba_distance ],
      v_c = [outerRadius * u_ba[0], outerRadius * u_ba[1]];
  return {x: v_c[0], y: v_c[1]};
}

// Define the drag behavior for when a user makes a hue filter selection by drag
var dragHueFilter = d3.behavior.drag(),
    dragHueFilterIsCW;
dragHueFilter.on('drag', function () {
  var angle = hueAnglePt(d3.event.x, d3.event.y).svgAngle+90;
  angle = angle < 0 ? angle + 360 : angle;
  angle = deg2rad(angle);

  // Determine if the drag is going CW or CCW; adjust angles as necessary
  var pastAngleData = hueMarker.select('path').datum();
  if(pastAngleData.endAngle < hueMarkerStartDragAngle) {
    dragHueFilterIsCW = true;
    if(angle > pastAngleData.startAngle) {
      angle = angle - Math.PI*2;
    }
  } else if (pastAngleData.endAngle > hueMarkerStartDragAngle) {
    dragHueFilterIsCW = false;
    if(angle < pastAngleData.startAngle)
      angle = angle + Math.PI*2;
  }

  hueMarker.select('path').transition()
    .duration(0)
    .call(hueArcTween, angle);

  hueMarker.select('.hueRegionEndLine')
      .attr('x1', hueLineEndPt(d3.event.x,d3.event.y).x)
      .attr('y1', hueLineEndPt(d3.event.x,d3.event.y).y);
})
.on('dragend', function() {
  var hueData = hueMarker.select('path').datum(),
      low = (360-Math.round(rad2deg(hueData.startAngle)-90))%360,
      high = (360-Math.round(rad2deg(hueData.endAngle)-90))%360;
  if(low==high) {
    hueMarker.remove();
    return;
  }

  // Because Colorgorical expects CCW hue range areas, if the drag is CW and
  //  not adjusted Colorgorical will apply the inverse hue range filter.
  if(!dragHueFilterIsCW) {
    var tmp = low;
    low = high;
    high = tmp;
  }

  hueMarker.classed('color-hf-'+low.toString()+'-'+high.toString(), true);
  addHueFilterToPanel(low, high);
});

// Add the drag handler to the event capturing invisible object placed above
//  all of the hue angles
ghostDonut.call(dragHueFilter)
    .on('mousedown', function() {
      var x = d3.mouse(hueArcg.node())[0],
          y = d3.mouse(hueArcg.node())[1],
          angle = hueAnglePt(x,y).svgAngle+90;
      angle = angle < 0 ? angle + 360 : angle;
      hueMarker = hueAreaSelectMarkers.append('g');
      hueMarker.append('path')
          .datum({endAngle: deg2rad(angle),
                  startAngle: deg2rad(angle)})
          .attr('d', hueRangeFilterArc)
          .style('fill', 'rgba(0,0,0,0.25)');
      hueMarkerStartDragAngle = deg2rad(angle);

      hueMarker.append('line')
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', hueLineEndPt(x,y).x).attr('y2', hueLineEndPt(x,y).y)
          .style(hueRegionLineStyle);
      hueMarker.append('line').attr('class', 'hueRegionEndLine')
          .attr('x1', 0).attr('y1', 0)
          .style(hueRegionLineStyle);
    });


////////////////////////////////////////////////////////////////////////////////
// Manual hue filter input interaction handling
function isOkHue() {
  var thisEl = d3.select(this),
      val = thisEl.property('value');
  thisEl.style('background', val === '' ? '#ff0000' : 'white');
}
function revertBG() { d3.select(this).style('background', 'white'); }
d3.select('#hueFilterRangeHigh').on('keyup', isOkHue).on('blur', revertBG);
d3.select('#hueFilterRangeLow').on('keyup', isOkHue).on('blur', revertBG);
d3.select('#hueFilterAddBtn')
    .on('click', function() {
      var high = d3.select('#hueFilterRangeHigh'),
          low = d3.select('#hueFilterRangeLow'),
          highV = high.property('value'),
          lowV = low.property('value');

      high.style('background', highV === '' ? '#ff0000' : 'white');
      low.style('background', lowV === '' ? '#ff0000' : 'white');
      if(lowV === '' || highV === '') return;
      highV = +highV;
      lowV = +lowV;

      // Process the data and add the defined range to the hue arc donut
      var startAngle = 360 - highV + 90,
          endAngle = 360 - lowV + 90;
      if(lowV > highV) startAngle = startAngle - 360;

      // append the angle fill
      hueMarker = hueAreaSelectMarkers.append('g')
          .classed('color-hf-'+lowV.toString()+'-'+highV.toString(), true);
      hueMarker.append('path')
          .datum({endAngle: deg2rad(endAngle),
                  startAngle: deg2rad(startAngle) })
          .attr('d', hueRangeFilterArc)
          .style('fill', 'rgba(0,0,0,0.25)');

      // append the angle lines
      var x1 = Math.cos(deg2rad(startAngle-90)), y1 = Math.sin(deg2rad(startAngle-90)),
          x2 = Math.cos(deg2rad(endAngle-90)), y2 = Math.sin(deg2rad(endAngle-90));

      hueMarker.append('line')
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', hueLineEndPt(x1,y1).x).attr('y2', hueLineEndPt(x1,y1).y)
          .style(hueRegionLineStyle);
      hueMarker.append('line').attr('class', 'hueRegionEndLine')
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', hueLineEndPt(x2,y2).x).attr('y2', hueLineEndPt(x2,y2).y)
          .style(hueRegionLineStyle);

      addHueFilterToPanel(lowV, highV);
      high.property('value', '');
      low.property('value', '');
    });
