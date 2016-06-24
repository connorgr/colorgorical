d3.select('#clearResultsBtn').on('click', function() {
  d3.selectAll('.paletteResult').remove();
});

var resultsColorSpace = 'RGB',
    resultsQuote = '"';

var colorConversionFns = {
  Hex: function(c) { return c.toString(); },
  RGB: function(c) {
    c = d3.rgb(c);
    c = [c.r, c.g, c.b].join(',');
    return 'rgb('+c+')';
  },
  Lab: function(c) { return 'Lab('+c.l+','+c.a+','+c.b+')'; },
  LCH: function(c) {
    c = d3.hcl(c);
    c = [c.l, Math.round(c.c), Math.round(c.h)].join(',');
    return 'LCH('+c+')';
  }
};

function formatResults() {
  var results = d3.selectAll('div.paletteResult'),
      format = resultsColorSpace;

  results.each(function() {
    var result = d3.select(this),
        palette = result.attr('data-palette').split(';');

    palette = palette.map(function(c) {
      c = c.replace('lab(','').replace(')','').split(',').map(function(d) {
        return +d;
      });
      return d3.lab(c[0], c[1], c[2]);
    });

    paletteStr = '['+resultsQuote+
        palette.map(colorConversionFns[format])
            .join(resultsQuote+', '+resultsQuote)+
        resultsQuote+']';
    result.select('input').property('value', paletteStr);
  });

  var swatchLists = d3.selectAll('ul.swatchList');
  swatchLists.each(function() {
    var swatchList = d3.select(this),
        colors = swatchList.selectAll('li span.swatchColorName');
    colors.each(function() {
      var color = d3.select(this),
          colorDataStr = color.attr('data-color-name');

      var c = colorDataStr.replace('lab(','').replace(')','').split(',')
          .map(function(d) { return +d; });
      c = d3.lab(c[0], c[1], c[2]);

      var cStr = colorConversionFns[format](c);
      color.text(cStr);
    });
  });
}


d3.selectAll('#resultsColorSpaceOpt button').on('click', function() {
  resultsColorSpace = d3.select(this).text();
  formatResults();
});

d3.selectAll('#resultsQuoteOpt button').on('click', function() {
  resultsQuote = d3.select(this).text();
  if(resultsQuote === 'No quote') resultsQuote = '';
  formatResults();
});

d3.selectAll('#resultsChartOpt label input').on('click', function() {
  var checkbox = d3.select(this),
      thisEl = d3.select(checkbox.node().parentElement),
      chartType = checkbox.property('value'),
      checkedState = thisEl.select('input[type="checkbox"]').property('checked'),
      charts;

  console.log(thisEl.node());
  thisEl.classed({active: !thisEl.classed('active')});

  if(chartType === 'bar') charts = d3.selectAll('.barContainer');
  else if(chartType === 'map') charts = d3.selectAll('.mapContainer');
  else if(chartType === 'scatter') charts = d3.selectAll('.scatterplotContainer');
  else if(chartType === 'colorInfo') charts = d3.selectAll('.colorSpaces');

  charts.style('display', checkedState ? 'inline-block' : 'none');
});
