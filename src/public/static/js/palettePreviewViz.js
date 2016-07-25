// palettePreviews contains functions that generate data or render
// visualizations, given a palette as input
var palettePreviews = {};

palettePreviews.getBarChartData = function() {
  var categories = 30; // well above the maximum possible palette size
  if(arguments.length > 0) size = +arguments[0];
  var data = [], i;
  for(i = 0; i < categories; i++) data.push(Math.random());
  var dMax = d3.max(data), dMin = d3.min(data);
  data = data.map(function(d) { return (0.8*(d - dMin) / (dMax - dMin))+0.1; });
  return data;
};
palettePreviews.barData = palettePreviews.getBarChartData();


palettePreviews.getScatterData = function() {
  var size = 50;
  if(arguments.length > 0) size = +arguments[0];
  var d = [],i;
  function pt() { return Math.floor(Math.random()*100); }
  for(i = 0; i < size; i++) d.push({x:pt(), y:pt(), val:pt()});
  return d;
};
palettePreviews.scatterData = palettePreviews.getScatterData();


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// BAR CHART
palettePreviews.drawBar = function(palette) {
  var numCategories = palette.length,
      bardata = palettePreviews.barData.slice(0, numCategories);

  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg').attr('class', 'colorgoricalBarchart');

      var height = 200,
          margin = { top: 10, right: 10, bottom: 10, left: 10 },
          width = 200;

      svg.attr('height', height)
          .attr('width', width);

      height = height - margin.top - margin.bottom;
      width = width - margin.left - margin.right;

      svg = svg.append('g')
          .attr('transform', 'translate('+margin.left+','+margin.right+')');

      var xDomain = [], xs;
      for(xs = 0; xs < numCategories; xs++) { xDomain.push(xs); }
      var x = d3.scale.ordinal().domain(xDomain)
              .rangeRoundBands([0, width], 0.1),
          y = d3.scale.linear().domain([0,1]).range([height, 0]),
          barWidth = numCategories > 9 ? width / numCategories : 20;


      var bar = svg.selectAll('rect')
                  .data(bardata)
                  .enter()
                  .append('rect')
                      .attr('x', function(d,i) { return x(i); })
                      .attr('y', function(d) { return y(d); })
                      .attr('height', function(d) { return height - y(d); })
                      .attr('width', x.rangeBand())
                      .style('fill', function(d,i) { return palette[i]; });

      var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).ticks(1).orient('left'),
          axisStyle = { fill: 'none', stroke: '#888', 'shape-rendering': 'crispEdges'};
      svg.append('g').attr('class', 'x axis')
          .attr('transform', 'translate(0,'+height+')')
          .style(axisStyle)
          .call(xAxis)
              .selectAll('text').remove();
      svg.append('g').attr('class', 'y axis')
          .style(axisStyle)
          .call(yAxis)
              .selectAll('text').remove();
    });
  }

  return chart;
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// SCATTER PLOT
palettePreviews.drawScatter = function() {
  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([palettePreviews.scatterData])
          .enter()
            .append('svg').attr('class', 'colorgoricalScatterplot');

      var height = 200,
          margin = { top: 10, right: 10, bottom: 10, left: 10 },
          width = 200;

      svg = svg.attr('height', height)
          .attr('width', width)
          .style('background', '#fff')
          .append('g')
              .attr('transform', 'translate('+margin.left+','+margin.top+')');

      height = height - margin.top - margin.bottom;
      width = width - margin.left - margin.right;

      var x = d3.scale.linear().domain([0,100]).range([0, width]),
          y = d3.scale.linear().domain([0,100]).range([height, 0]);

      var xAxis = d3.svg.axis().scale(x).ticks(4).orient('bottom').tickFormat(''),
          yAxis = d3.svg.axis().scale(y).ticks(4).orient('left').tickFormat('');

      var colorScale = d3.scale.category10();

      svg.selectAll('circle')
          .data(palettePreviews.scatterData)
          .enter()
          .append('circle')
              .attr('class', 'point')
              .attr('cx', function(d) { return x(d.x); })
              .attr('cy', function(d) { return y(d.y); })
              .attr('data-val', function(d) { return d.val; })
              .attr('r', 5);

      var xAxisG = svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,'+height+')'),
          yAxisG = svg.append('g').attr('class', 'y axis');

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);

      var axisStyle = {  fill: 'none', stroke: '#888', 'shape-rendering': 'crispEdges'};
      xAxisG.selectAll('path').style(axisStyle);
      yAxisG.selectAll('path').style(axisStyle);
    });
  }

  return chart;
};


var ghostScatter = d3.select('body').append('div').datum(['']).call(palettePreviews.drawScatter());
d3.selectAll('.colorgoricalScatterplot')
    .attr('display', 'none')
    .attr('visibility', 'hidden');


// Clones a predrawn scatterplot and recolors it, provided the colorScale
palettePreviews.cloneScatter = function(selection, colorScale) {
  var numColors = colorScale.length,
      quantize = d3.scale.quantize()
          .domain([0, 100])
          .range(d3.range(numColors).map(function(i) { return i; }));

  var scatterClone = ghostScatter.select('.colorgoricalScatterplot').node().cloneNode(true);
  selection.node().appendChild(scatterClone);

  var scatter = selection.select('.colorgoricalScatterplot')
      .attr('display', 'block')
      .attr('visibility', 'visible');

  var colors = d3.scale.linear().domain([0,100]).range([0,numColors]);

  scatter.selectAll('.point')
      .style('fill', function() {
        return 'none';
      })
      .style('stroke', function(d) {
        var val = parseInt(d3.select(this).attr('data-val')),
            index = Math.floor(colors(val));
        index = index == numColors ? index-1:index;
        return colorScale[index];
      })
      .style('stroke-width', 1.5);
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// MAP DRAWING
// Assumes topo data is previously loaded (e.g., in index.html)
var us = ghostMapData.topo;
palettePreviews.drawMap = function() {
  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([''])
          .enter()
            .append('svg').attr('class', 'colorgoricalMap');

      var height = 200,
          margin = { top: 0, right: 0, bottom: 0, left: 0 },
          width = 200;

      svg.attr('height', height).attr('width', width)
          .append('g')
              .attr('transform', 'translate('+margin.left+','+margin.top+')');

      var projection = d3.geo.albersUsa()
          .scale(2000)
          .translate([2*width / 10, height / 2]);

      var path = d3.geo.path()
          .projection(projection);

      svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
      .enter().append("path")
        .attr('data-id', function(d) { return d.id; })
        .attr('d', path);

      svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("d", path);
    });
  }
  return chart;
};


var ghostMap = d3.select('body').append('div').datum(['']).call(palettePreviews.drawMap());
d3.selectAll('.colorgoricalMap')
    .attr('display', 'none')
    .attr('visibility', 'hidden');


palettePreviews.cloneMap = function(selection, colorScale) {
  var numColors = colorScale.length,
      quantize = d3.scale.quantize()
          .domain([0, 0.15])
          .range(d3.range(numColors).map(function(i) { return i; }));

  var mapClone = ghostMap.select('.colorgoricalMap').node().cloneNode(true);
  selection.node().appendChild(mapClone);

  var map = selection.select('.colorgoricalMap')
      .attr('display', 'block')
      .attr('visibility', 'visible');

  map.select('.counties').selectAll('path')
      .attr('class', function(d) {
        var id = d3.select(this).attr('data-id') || 1001;
        var value = rateByRandom.get(id) || 0.5;
        return quantize(value); })
      .style('fill', function() {
        var q = d3.select(this).attr('class');
        if(q) q = parseInt(q);
        else q = 0;

        return colorScale[q];
      })
      .style('stroke', 'white');

  map.select('.states')
      .style('fill', 'none')
      .style('stroke', 'black');
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// COLOR SPACE DIAGNOSTIC DRAWING
palettePreviews.drawLightness = function(palette) {
  palette = palette.map(function(p) { return d3.lab(p); });
  var offsetDict = {},
      paletteOffset = [];
  palette.forEach(function(c) {
    var offsets = Object.keys(offsetDict).map(function(d) { return +d; }),
        l = 5*Math.round(c.l/5),
        lIsOffset = offsets.indexOf(l) >= 0;

    if(lIsOffset) {
      offsetDict[l] = offsetDict[l] + 1;
      paletteOffset.push(offsetDict[l]);
    } else {
      offsetDict[l] = 0;
      paletteOffset.push(0);
    }
  });

  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([palette])
          .enter()
            .append('svg').attr('class', 'colorgoricalColorspaceLightness');

      var actualSVG = svg; // semi-private variable for width adjustment

      var height = 200,
          margin = { top: 10, right: 10, bottom: 10, left: 40 },
          width = 200;

      svg.attr('height', height)
          .attr('width', width);

      height = height - margin.top - margin.bottom;
      width = width - margin.left - margin.right;

      svg = svg.append('g')
          .attr('transform', 'translate('+margin.left+','+margin.right+')');

      var y = d3.scale.linear().domain([0,100]).range([height, 0]),
          yAxis = d3.svg.axis().scale(y).ticks(10).orient('left'),
          axisStyle = { fill: 'none', stroke: '#888', 'shape-rendering': 'crispEdges'},
          axisTextStyle = { fill: '#888', stroke: 'none', 'font-size':10 };

      svg.append('g').attr('class', 'y axis').style(axisStyle).call(yAxis)
          .selectAll('text').style(axisTextStyle);

      var pts = svg.append('g').selectAll('g')
              .data(palette)
              .enter()
              .append('g')
                  .attr('transform', function(d,i) {
                    var dx = paletteOffset[i]*15;
                    return 'translate('+dx+',0)';
                  });
      pts.append('circle')
          .attr('cx', 10)
          .attr('cy', function(d) { return y(d.l); })
          .attr('r', 5)
          .style('fill', function(d) { return d; })
          .style('stroke', function(d) { return Math.round(d.l/5)*5 > 85 ? '#aaa' : 'none'; })
          .style('stroke-width', 1);
      pts.append('line')
          .attr('x1', 0).attr('y1', function(d) { return y(d.l); })
          .attr('x2', 10).attr('y2', function(d) { return y(d.l); })
          .style('stroke', function(d){ return d; })
          .style('stroke-width', 1);

      svg.append('text').text('CIE Lightness')
          .attr('text-anchor', 'middle')
          .attr('transform', 'rotate(-90)')
          .attr('x', -height/2)
          .attr('y', -26)
          .style(axisTextStyle)
          .style('font-size', 14);

      actualSVG.attr('width', margin.left + (d3.max(paletteOffset)+1)*15);
    });
  }

  return chart;
};


palettePreviews.drawCH = function(palette) {
  palette = palette.map(function(p) { return d3.hcl(p); });

  function deg2rad(d) { return d*(Math.PI / 180);}
  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([palette])
          .enter()
            .append('svg').attr('class', 'colorgoricalColorspaceLightness');

      var height = 200, width = 200,
          margin = { top: 15, right: 15, bottom: 15, left: 15 };

      svg.attr('height', height).attr('width', width);

      height = height - margin.top - margin.bottom;
      width = width - margin.left - margin.right;

      svg = svg.append('g')
          .attr('transform', 'translate('+margin.left+','+margin.right+')');

      var chromaScale = d3.scale.linear().domain([0,125]).range([0, width/2]);

      // add coordinate system labels
      var labels = svg.append('g'),
          labelStyle = {
            fill: '#888',
            'font-size': 12
          };
      labels.append('text').text('r: chroma');
      labels.append('text').text('⊾').attr('class', 'angle')
          .attr('x', -2)
          .attr('y', 12);
      labels.append('text').text(': hue')
          .attr('x', 9)
          .attr('y', 12);
      labels.selectAll('text').style(labelStyle);
      labels.select('.angle').style('font-size', 18);

      var degLabels = svg.append('g');
      degLabels.append('text')
          .text('90°').attr('x', width/2).attr('y', -1);
      degLabels.append('text')
          .text('270°').attr('x', width/2)
          .attr('y', height+labelStyle['font-size']+1);
      degLabels.append('text')
          .text('0°').attr('x', height/2).attr('y', -width-2)
          .attr('transform', 'rotate(90)');
      degLabels.append('text')
          .text('180°').attr('x', -height/2).attr('y', -2)
          .attr('transform', 'rotate(-90)');

      degLabels.selectAll('text')
          .attr('text-anchor', 'middle')
          .style(labelStyle);

      // draw chroma circles
      svg.append('g').attr('transform', 'translate('+width/2+','+height/2+')')
          .selectAll('circle')
          .data([1, 25, 50, 75, 100, 125])
          .enter()
          .append('circle')
              .attr('cx', 0).attr('cy', 0)
              .attr('r', function(d) { return chromaScale(d); })
              .style('fill', 'none')
              .style('stroke', '#ccc')
              .style('stroke-width', 1);

      var chroma = d3.scale.linear().domain([0,125]).range([height/2,0]),
          chromaAxis = d3.svg.axis().scale(chroma).ticks(4).orient('left'),
          axisStyle = { fill: 'none', stroke: '#aaa', 'shape-rendering': 'crispEdges'},
          axisTextStyle = { fill: '#888', stroke: 'none', 'font-size':10 };

      svg.append('g')
          .attr('transform', 'translate('+width/2+',0)')
          .attr('class', 'y axis').style(axisStyle).call(chromaAxis)
          .selectAll('text').style(axisTextStyle);

      var x = function(d) {
                var h =  d.h + 90;
                h = d.h > 180 ? d.h - 360 : d.h;
                var pt = Math.cos(deg2rad(h)),
                    k = chromaScale;
                return k(d.c)*pt;
              },
          y = function(d) {
                    var h = d.h > 180 ? d.h - 360 : d.h,
                        pt = Math.sin(-deg2rad(h)),
                        k = chromaScale;
                    return k(d.c)*pt;
                  };

      var hueDonut = svg.append('g')
              .attr('transform', 'translate('+width/2+','+height/2+')'),
          pts = hueDonut.selectAll('circle')
              .data(palette)
              .enter()
              .append('circle')
                  .attr('cx', x)
                  .attr('cy', y)
                  .attr('r', 5)
                  .style('fill', function(d) { return d; })
                  .style('stroke', function(d) { return d.l > 85 ? '#aaa' : 'none'; })
                  .style('stroke-width', 1);
        });
  }

  return chart;
};


palettePreviews.drawab = function(palette) {
  palette = palette.map(function(p) { return d3.lab(p); });
  function chart(selection) {
    selection.each(function(data) {
      var svg = d3.select(this)
          .selectAll('svg')
          .data([palette])
          .enter()
            .append('svg').attr('class', 'colorgoricalColorspaceLightness');

      var height = 200, width = 200,
          margin = { top: 15, right: 15, bottom: 15, left: 15 };

      svg.attr('height', height).attr('width', width);

      height = height - margin.top - margin.bottom;
      width = width - margin.left - margin.right;

      svg = svg.append('g')
          .attr('transform', 'translate('+margin.left+','+margin.right+')');

      var labels = svg.append('g'),
          labelStyle = {
            fill: '#888',
            'font-size': 12
          };
      labels.append('text').text('x: CIE a');
      labels.append('text').text('y: CIE b')
          .attr('y', 12);
      labels.selectAll('text').style(labelStyle);
      labels.select('.angle').style('font-size', 18);


      var x = d3.scale.linear().domain([-125, 125]).range([0,width]),
          y = d3.scale.linear().domain([-125, 125]).range([height,0]),
          axisTicks = [-125, -100, -75, -50, -25, 25,50,75,100,125],
          xAxis = d3.svg.axis().scale(x).tickValues(axisTicks).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).tickValues(axisTicks).orient('left'),
          axisStyle = { fill: 'none', stroke: '#aaa', 'shape-rendering': 'crispEdges'},
          axisTextStyle = { fill: '#888', stroke: 'none', 'font-size':10 };

      var axisGroup = svg.append('g');
      axisGroup.append('g')
          .attr('transform', 'translate(0,'+height/2+')')
          .attr('class', 'x axis').style(axisStyle).call(xAxis)
          .selectAll('text').style(axisTextStyle);
      axisGroup.append('g')
          .attr('transform', 'translate('+width/2+',0)')
          .attr('class', 'y axis').style(axisStyle).call(yAxis)
          .selectAll('text').style(axisTextStyle);
      axisGroup.selectAll('g').selectAll('text')
        .each(function(d,i) {
          if(d%50) d3.select(this).remove();
        });

      var ptGroup = svg.append('g');
      ptGroup.selectAll('circle')
          .data(palette)
          .enter()
          .append('circle')
              .attr('cx', function(d) { return x(d.a); })
              .attr('cy', function(d) { return y(d.b); })
              .attr('r', 5)
              .style('fill', function(d) { return d; });
    });
  }

  return chart;
};
