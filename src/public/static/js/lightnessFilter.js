var lightnessFilterBar = d3.select('#lightnessFilterBar');

(function() {
  var width = +lightnessFilterBar.style('width').replace('px',''),
      height = +lightnessFilterBar.style('height').replace('px',''),
      margin = {bottom: 0, left: 5, right: 5, top: 0};

  var svg = lightnessFilterBar.append('g')
    .attr('transform', 'translate('+margin.left+','+margin.top+')');

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  var stripes = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100],
      stripeW = width/stripes.length;

  var stripeX = d3.scale.linear()
          .domain(d3.extent(stripes))
          .range([0,width-stripeW]),
      reverseStripeX = d3.scale.linear()
          .domain([0,width-stripeW])
          .range(d3.extent(stripes));

  var gradient = svg.append('g').selectAll('rect')
      .data(stripes).enter()
      .append('rect')
        .style('fill', function(d) { return d3.lab(d, 0, 0); })
        .attr('x', function(d) { return stripeX(d); })
        .attr('y', height/3)
        .attr('width', function(d,i) {
          return stripeW + (i < stripes.length-1 ? 1 : 0);
        })
        .attr('height', 2*height/3);

  var dragExtent = svg.append('rect')
          .attr({
            x: stripeX(25), y:height/3-2, width:stripeX(85)-stripeX(25),
            height: 4
          }).style({fill: 'rgba(0,0,0,0.75)', stroke: 'rgba(100,100,100,0.5)'});

  var lowerDrag = svg.append('circle')
          .attr({r: 4, cx: stripeX(25), cy: height/3})
          .style({fill: '#000', stroke: '#fff'});

  var upperDrag = svg.append('circle')
          .attr({r: 4, cx: stripeX(85), cy: height/3})
          .style({fill: '#fff', stroke: '#000'});

  function draggedLower(d){
    var x = Math.floor(d3.event.x / stripeW)*stripeW +
        (d3.event.x%stripeW < 0.5*stripeW ? 0 : stripeW);
    if(x < 0) x = 0;
    if(x > +upperDrag.attr('cx') - stripeW) x = +upperDrag.attr('cx') - stripeW;
    d3.select(this).attr('cx', x);
    dragExtent.attr('x', x).attr('width', +upperDrag.attr('cx')-x);
    d3.select('#lightnessFilterRangeLow')
        .property('value', Math.round(reverseStripeX(x)));
  }
  function draggedUpper(d){
    var x = Math.floor(d3.event.x / stripeW)*stripeW +
        (d3.event.x%stripeW < 0.5*stripeW ? 0 : stripeW);

    if(x < +lowerDrag.attr('cx') + stripeW) x = +lowerDrag.attr('cx') + stripeW;
    if(x > width) x = width;
    d3.select(this).attr('cx', x);
    dragExtent.attr('width', x-lowerDrag.attr('cx'));
    d3.select('#lightnessFilterRangeHigh')
        .property('value', Math.round(reverseStripeX(x)-5));
  }
  lowerDrag.call(d3.behavior.drag().on("drag", draggedLower));
  upperDrag.call(d3.behavior.drag().on("drag", draggedUpper));

  d3.select('#lightnessFilterRangeLow')
      .property('value', 25);
  d3.select('#lightnessFilterRangeHigh')
      .property('value', 85);
})();
