function makePalette() {
  var query = {paletteSize: +d3.select('#paletteSize').property('value')};

  function formatSlider(slider) { return (+slider.property('value'))/100; }
  query.weights = {
    ciede2000: formatSlider(d3.select('#modelWpd')),
    nameDifference: formatSlider(d3.select('#modelWnd')),
    nameUniqueness: formatSlider(d3.select('#modelWnu')),
    pairPreference: formatSlider(d3.select('#modelWpp'))
  };

  query.hueFilters = [];
  d3.select('#hueFilterAddedPanel').selectAll('li').each(function() {
      var el = d3.select(this);
      query.hueFilters.push([+el.attr('data-hue-low'),+el.attr('data-hue-high')]);
  });

  query.lightnessRange = [
    d3.select('#lightnessFilterRangeLow').property('value'),
    d3.select('#lightnessFilterRangeHigh').property('value')
  ];

  query.startPalette = [];
  var cs = d3.selectAll('#startColorAddedPanel li').each(function() {
    var el = d3.select(this);
    query.startPalette.push(
      el.attr('data-color').split(',').map(function(d) { return +d; })
    );
  });

  d3.select('#generate').property('disabled', true);
  d3.select('#querySpinnerArea svg').classed({spinner: true});

  var callback = function(err, res) {
    var data = JSON.parse(res.response);

    var c = d3.select('#resultsPanel')
        .insert('div', ":first-child").html(data.html);

    c.select('.closePaletteResult').on('click', function () {
      c.remove();
    });
    c.select('.minMaxPaletteResult').on('click', function () {
      var btn = d3.select(this),
          minAction = btn.classed('minPaletteResult'),
          examples = c.select('.exampleCharts'),
          swatches = c.select('.swatchList');
      examples.style('display', minAction? 'none' : 'block');
      swatches.style('display', minAction? 'none' : 'block');

      btn.classed({
        minPaletteResult: !minAction,
        maxPaletteResult: minAction,
        'fa-minus': !minAction,
        'fa-plus': minAction
      });
    });

    d3.select('#generate').property('disabled', false);
    d3.select('#querySpinnerArea svg').classed({spinner: false});

    formatResults(); // from resultBar. makes sure formatting is correct.

    // Add preview visualizations
    var scatter = c.select('.scatterplotContainer'),
        map = c.select('.mapContainer'),
        bar = c.select('.barContainer'),
        colorspaceLightness = c.select('.colorSpaces-lightness'),
        colorspaceCH = c.select('.colorSpaces-CH'),
        colorspaceAB = c.select('.colorSpaces-ab');

    var colors = data.palette.map(function(d) {
      return d3.lab(d[0], d[1], d[2]).toString();
    });

    palettePreviews.cloneScatter(scatter, colors);
    palettePreviews.cloneMap(map, colors);
    bar.datum(['']).call(palettePreviews.drawBar(colors));

    colorspaceLightness.datum(['']).call(palettePreviews.drawLightness(colors));
    colorspaceCH.datum(['']).call(palettePreviews.drawCH(colors));
    colorspaceAB.datum(['']).call(palettePreviews.drawab(colors));

    // adjust chart visibility depending on results settings
    var chartOptions = d3.selectAll('#resultsChartOpt label');
    chartOptions.each(function() {
      var thisEl = d3.select(this),
          checkbox = thisEl.select('input'),
          chartType = checkbox.property('value'),
          checkedState = thisEl.classed('active'),
          chart;
      if(chartType === 'bar') chart = c.selectAll('.barContainer');
      else if(chartType === 'map') chart = c.selectAll('.mapContainer');
      else if(chartType === 'scatter') chart = c.selectAll('.scatterplotContainer');
      else if(chartType === 'colorInfo') chart = d3.selectAll('.colorSpaces');

      chart.style('display', checkedState ? 'inline-block' : 'none');
    });

    // add colors to starting palette if clicked
    c.selectAll('.addToStart').on('click',function() {
      var btn = d3.select(this),
          color = d3.select(btn.node().parentElement).select('.swatchColorName')
              .attr('data-color-name'),
          modelColor = color.replace('lab(','').replace(')','').split(',')
              .map(function(c) { return +c; }),
          mc = modelColor.join(','),
          addList = d3.select('#startColorAddedPanel');

      var li = addList.append('li')
          .attr('data-color', mc);
      li.append('i').attr('class', 'fa fa-trash-o')
          .on('click', function() { li.remove(); });
      li.append('span').text(' ' + color);
      li.append('span').attr('class', 'pull-right')
          .style('border', '1px solid white')
          .style('margin-top', '3px')
          .style('width', '12px')
          .style('height', '12px')
          .style('background', d3.lab.apply(this, modelColor));
    });
  };


  makePaletteRequest(query, callback);
}
