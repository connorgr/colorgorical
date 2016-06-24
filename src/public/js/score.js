function renderHistogram(selection, values) {
  function quantile(p) {
    var idx = 1 + (values.length - 1) * p,
        lo = Math.floor(idx),
        hi = Math.ceil(idx),
        h  = idx - lo;
    return (1-h) * values[lo] + h * values[hi];
  }
  function freedmanDiaconis() {
    var iqr = quantile(0.75) - quantile(0.25),
        sqrtBins = Math.sqrt(values.length);
    if(isNaN(iqr)) return sqrtBins;
    var nb = 2 * iqr * Math.pow(values.length,-1/3);
    if(nb < sqrtBins) return sqrtBins;
    else return nb;
  }
  var numBins = Math.round(freedmanDiaconis());

  // A formatter for counts.
  var formatCount = d3.format(",.0f");

  var margin = {top: 10, right: 30, bottom: 30, left: 30},
      width = 350 - margin.left - margin.right,
      height = 75 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain(d3.extent(values))
      .range([0, width]);

  // Generate a histogram using twenty uniformly-spaced bins.
  var histFn = d3.layout.histogram()
      .bins(x.ticks(numBins));

  var data = histFn(values);

  var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.y; })])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(x.ticks(numBins+1))
      // .ticks(numBins)
      .orient("bottom");

  var svg = selection.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var bar = svg.selectAll(".bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  var barWidth = width/numBins - 1;
  bar.append("rect")
      .attr("x", 1)
      .attr('width', barWidth)
      // .attr("width", x(data[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); })
      .style('fill', 'rgb(13, 178, 147)')
      .style('stroke', 'white')
      .style('stroke-width', 1);

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", barWidth / 2)
      .attr("text-anchor", "middle")
      .style('stroke', 'white')
      .text(function(d) { return formatCount(d.y); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
  svg.selectAll('text').style('font-size', 10).style('stroke', 'none').style('fill', 'white');
  var axisStyle = {
    fill: 'none',
    'stroke': 'black',
    'stroke-width': 1,
    'shape-rendering': 'crispEdges'
  };
  svg.selectAll('.axis path').style(axisStyle);
  svg.selectAll('.axis line').style(axisStyle);
  svg.selectAll('.axis text').style('fill', 'black');
}

function showScores(data) {
  data = JSON.parse(data);

  var container = d3.select('#paletteScoreResults'),
      panel = container.insert('div', ':first-child').classed('container-fluid', true).html(data.html),
      scores = data.minScores,
      name = data.name;

  console.log(scores);
  console.log(data);
  var scoreSummaries = d3.select('#paletteScoreSummaryResults');
  scoreSummaries.select('.paletteScoreSummary-header')
      .append('td').text(name);
  function rndSigFig(i) { return Math.round(i*1000) / 1000; }
  scoreSummaries.select('.paletteScoreSummary-de')
      .append('td').text(rndSigFig(scores.de));
  scoreSummaries.select('.paletteScoreSummary-nd')
      .append('td').text(rndSigFig(scores.nd));
  scoreSummaries.select('.paletteScoreSummary-nu')
      .append('td').text(rndSigFig(scores.nu));
  scoreSummaries.select('.paletteScoreSummary-pp')
      .append('td').text(rndSigFig(scores.pp));

  panel.select('.closePaletteScore')
      .on('click', function() { panel.remove(); });

  function renderSwatch() {
    var c = d3.select(this),
        lab = c.attr('data-lab-color');
    if(!lab || lab===null) return;
    lab = lab.replace(/\[|\]|\s/g, '').split(',')
        .map(function(d) { return +d; });
    c.style('background', d3.lab(lab[0], lab[1], lab[2]));
  }
  panel.selectAll('table.scoreResultTable tbody tr td').each(renderSwatch);
  panel.selectAll('table.deMtx tbody tr td').each(renderSwatch);
  panel.selectAll('table.ndMtx tbody tr td').each(renderSwatch);
  panel.selectAll('table.ppMtx tbody tr td').each(renderSwatch);

  var deFlat = data.deMtx.reduce(function(a, b) { return a.concat(b); }, []),
      ndFlat = data.ndMtx.reduce(function(a, b) { return a.concat(b); }, []),
      ppFlat = data.ppMtx.reduce(function(a, b) { return a.concat(b); }, []);

  deFlat = deFlat.filter(function(d) { return d != "-"; });
  ndFlat = ndFlat.filter(function(d) { return d != "-"; });
  ppFlat = ppFlat.filter(function(d) { return d != "-"; });

  renderHistogram(panel.select('.score-nuMtx-well'), data.nuScores);
  renderHistogram(panel.select('.score-deMtx-well'), deFlat);
  renderHistogram(panel.select('.score-ndMtx-well'), ndFlat);
  renderHistogram(panel.select('.score-ppMtx-well'), ppFlat);
}

d3.selectAll('.paletteCollectionListItem').on('click', function() {
  var thisEl = d3.select(this),
      palette = thisEl.attr('data-palette'),
      name = thisEl.text().replace(/\s/g, '');

  // Clean palette strings
  palette = palette.replace(/\[|\]/g, '').replace(/'r/g, 'r').split('\',');
  palette[palette.length-1] = palette[palette.length-1].replace('\'','');
  palette = palette.map(function(d) { return d3.lab(d.replace(/\s/g, '')); });
  // Convert palette to Lab list
  palette = palette.map(function(d) { return [d.l, d.a, d.b]; });

  var data = { palette: palette, name: name };
  data = JSON.stringify(data);
  $.post('/scorePalette', data, showScores);
});


d3.select('#userDefinedScoreBtn').on('click', function() {
  var validHex = function(c) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(c);
  };
  var validRGB = function(c) {
    return /^rgb\(([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5]),\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5]),\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\)/i.test(c);
  };
  // Lab ranges: L = [0,100]  a = [-85, 100]  b = [-110, 95]
  var validLab = function(c) {
    if(c.indexOf('lab(') < 0 && c.indexOf('Lab(') < 0) return false;
    c = c.replace('lab(', '').replace('Lab(', '').replace(')','').split(',');
    c = c.map(function(d) { return +d; });
    areNumbers = !c.reduce(function(cs, c) { return isNaN(c) || cs; }, false);
    return c.length == 3 && areNumbers;
  };
  function validate(c) {
    var tests = [validHex, validRGB, validLab];
    console.log(c, tests.map(function(t) { return t(c); }));
    return tests.reduce(function(ts, t) { return ts || t(c); }, false);
  }


  var inputField = d3.select('#userDefinedScorePalette'),
      input = inputField.property('value');
  if(input === '') return;
  input = input.replace(/\s/g, '').split(';');

  var okColors = input.filter(validate);
  if(okColors.length < 2) return;

  var labVersions = okColors.map(function(d) { return d3.lab(d); }),
      palette = labVersions.map(function(d) { return [d.l, d.a, d.b]; });

  var data = { palette: palette };
  data = JSON.stringify(data);
  $.post('/scorePalette', data, showScores);
});

d3.select('#showComparisonPalettesBtn').on('click', function() {
  function drawBarcharts(container, palettes, paletteScores) {
    // Convert JSON into a flat array for each size
    function flat(size) {
      var sizeSet = palettes[size],
          paletteSetNames = Object.keys(sizeSet),
          pals = paletteSetNames.map(function(k) {
            var ps = sizeSet[k],
                pNames = Object.keys(ps);
            return pNames.map(function(n) {
              var scores = paletteScores[size][k][n];
              return {size: +size, setName: k, name: n, palette: ps[n],
                      de: scores.de, nd: scores.nd, pp: scores.pp, nu:scores.nu
                     };
            });
          });
      return pals.reduce(function(a,b){ return a.concat(b); }, []);
    }

    var data = [ flat('3'), flat('5'), flat('8') ];

    var margin = { top: 50, right: 15, bottom: 15, left: 50 },
        height = 1200 - margin.top - margin.bottom,
        width = 600 - margin.left - margin.right,
        sizeGroupMargin = { top: 50, right: 0, bottom: 145, left: 0 },
        sizeGroupHeight = height/3 - sizeGroupMargin.top - sizeGroupMargin.bottom,
        facetScoreMargin = { top: 15, right: 0, bottom: 15, left: 0 },
        facetScoreHeight = sizeGroupHeight/4 - facetScoreMargin.top - facetScoreMargin.bottom;

    var x = d3.scale.ordinal()
            .domain(data[0].map(function(d){ return d.name; }))
            .rangeRoundBands([0, width], 0.1, 1.0),
        y_range = [facetScoreHeight, 0],
        y_de = d3.scale.linear().domain([0, 70]).range(y_range),
        y_pref = d3.scale.linear().domain([-86, 10]).range(y_range),
        y_name = d3.scale.linear().domain([0, 1]).range(y_range),
        ys = { de: y_de, nd: y_name, pp: y_pref, nu: y_name };

    var xAxis = d3.svg.axis().scale(x).orient('bottom'),
        yAxis = {
          de: d3.svg.axis().scale(y_de).orient('left').tickValues([0,70]),
          nd: d3.svg.axis().scale(y_name).orient('left').tickValues([0,1]),
          pp: d3.svg.axis().scale(y_pref).orient('left').ticks([-85, 0]).tickValues([-85, 0]),
          nu: d3.svg.axis().scale(y_name).orient('left').tickValues([0,1])
        };

    var barFill = d3.scale.ordinal()
        .domain(['ColorBrewer', 'Microsoft', 'Tableau'])
        .range(["rgb(99, 136, 166)","rgb(32, 216, 253)","rgb(7, 77, 101)"]);

    var svg = container.insert('svg', ':first-child')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var sizeGroups = svg.selectAll('g')
            .data(data)
            .enter()
            .append('g').attr('transform', function(d,i) {
              var h = sizeGroupHeight + sizeGroupMargin.top +
                  sizeGroupMargin.bottom;
              return 'translate(0,'+(h*i)+')';
            }),
        scoreGroups = sizeGroups.selectAll('g')
            .data(function(ds) {
              var newData =['de', 'nd', 'pp', 'nu'].map(function(sd) {
                return ds.map(function(i) {
                  return {
                    name: i.name,
                    score: i[sd],
                    scoreType: sd,
                    setName: i.setName,
                    size: i.size,
                    de: i.de,
                    nd: i.nd,
                    pp: i.pp,
                    nu: i.nu
                  };
                });
              });
              return newData;
            })
            .enter()
            .append('g')
                .attr('transform', function(d,i) {
                  var fullHeight = facetScoreHeight + facetScoreMargin.top + facetScoreMargin.bottom;
                      yT = fullHeight*i;
                  return 'translate(0,'+yT+')';
                });

    sizeGroups.append('text')
        .attr('x', -margin.left)
        .attr('y', -20)
        .style('font-size', 20)
        .style('font-weight', 'bold')
        .text(function(d,i) {
          return ['3', '5', '8'][i] + '-Color Palette Scores';
        });

    sizeGroups.append('line')
        .attr('x1', -margin.left).attr('x2', width + margin.right)
        .attr('y1', sizeGroupHeight+sizeGroupMargin.bottom - 5)
        .attr('y2', sizeGroupHeight+sizeGroupMargin.bottom - 5)
        .style('stroke', 'black')
        .style('stroke-width', 2);

    scoreGroups.append('g')
        .attr('class', 'x axis')
        .attr('transform', function(d,i) {
          if(d[0].scoreType === 'pp') return 'translate(0,'+ys[d[0].scoreType](0)+')';
          return 'translate(0,'+facetScoreHeight+')';
        }).call(xAxis).selectAll('text').remove();

    var sizeGroupAxis = sizeGroups.append('g')
        .attr('class', 'x axis scoreGroupAxis')
        .attr('transform', 'translate(0,'+(sizeGroupHeight)+')')
        .call(xAxis);
    sizeGroupAxis.selectAll('text').attr('y', function(d,i) {
          var y = +d3.select(this).attr('y');
          if(i % 2) return y;
          else return y + 12;
        });
    sizeGroupAxis.selectAll('.tick line').attr('y2', function(d,i) {
      var y = +d3.select(this).attr('y2');
      return i % 2 ? y : y + 12;
    });

    scoreGroups.each(function(d,i) {
      d3.select(this).append('g')
          .attr('class', 'y axis')
          .call(yAxis[d[0].scoreType]);
    });

    // add DE limitation line showing difficulty
    scoreGroups.each(function(d,i) {
      if(d[0].scoreType !== 'de') return;
      d3.select(this).append('line')
          .attr('x1',0).attr('x2', width)
          .attr('y1', ys[d[0].scoreType](15)).attr('y2', ys[d[0].scoreType](15))
          .style('stroke', 'red')
          .style('stroke-width', 1);
    });

    var bars = scoreGroups.selectAll('rect')
        .data(function(d){ return d; })
        .enter()
            .append('rect')
            .attr('class', function(d,i) { return d.name + ' bar'; })
            .attr('x', function(d) { return x(d.name); })
            .attr('y', function(d,i) {
              return ys[d.scoreType](Math.max(0, d.score));
            })
            .attr('width', x.rangeBand())
            .attr('height', function(d,i) {
              return Math.abs(ys[d.scoreType](d.score) - ys[d.scoreType](0));
            })
            .style('fill', function(d,i) { return barFill(d.setName); });

    // var paletteSwatches = scoreGroups
    //   // .append('g')
    //   //         .data(function(d) { return d; })
    //   //         .attr('class', 'paletteSwatches')
    //   //         .attr('transform', 'translate(0'+(sizeGroupHeight+20)+')')
    //   //         .selectAll('g')
    //         .data(function(d){ return d; })
    //         .append('g').attr('class', function(d) { return d.name; })
    //         .append('rect');

    var paletteSwatches = sizeGroups.append('g')
        .attr('class', 'swatches')
        .attr('transform', 'translate(0,'+(sizeGroupHeight+40)+')')
        .selectAll('g')
        .data(function(d) { return d; })
        .enter()
        .append('g')
            .attr('class', 'comparisonPaletteSwatch')
            .attr('transform', function(d,i) {
              return 'translate('+(x(d.name) + x.rangeBand()/2)+', 0)';
            })
          .selectAll('rect')
              .data(function(d) { return d.palette; })
              .enter()
              .append('rect')
                  .attr('x', -5)
                  .attr('y', function(d,i) { return 12*i; })
                  .attr('width', 10)
                  .attr('height', 10)
                  .style('fill', function(d) { return d; });

    var scoreLabels = scoreGroups.append('text')
        .attr('x', -25)
        .attr('text-anchor', 'end')
        .attr('y', facetScoreHeight)
        .style('cursor', 'pointer')
        .text(function(d,i) { return ['DE', 'ND', 'PP', 'NU'][i]; })
        .on('click', function(d,i) {
          var labelName = d3.select(this).text().toLowerCase();

          var paletteNames = d.map(function(p) { return p.name; }),
              x0 = x.domain(
                d.sort(function(a,b) {
                  return b[labelName] - a[labelName];
                }).map(function(p) { return p.name; })
              ).copy();

          bars.sort(function(a,b) { return x0(a.name) - x0(b.name); });
          var transition = svg.transition().duration(200),
              delay = function(d,i) { return i * 10; };
          transition.selectAll('.bar')
              .delay(delay).attr('x', function(p) { return x0(p.name); });

          var tAxis = transition.selectAll('.scoreGroupAxis.axis').call(xAxis);
          tAxis.selectAll('text').attr('y', function(d,i) {
                var y = +d3.select(this).attr('y');
                if(i % 2) return 9;
                else return 9 + 12;
              });
          tAxis.selectAll('.tick line').attr('y2', function(d,i) {
            var y = +d3.select(this).attr('y2');
            return i % 2 ? 6 : 6 + 12;
          });
          tAxis.selectAll('g').delay(delay);

          transition.selectAll('.comparisonPaletteSwatch')
              .delay(delay).attr('transform', function(d,i) {
                return 'translate('+(x0(d.name) + x0.rangeBand()/2)+', 0)';
              });

        });

    scoreGroups.append('line').attr('x1', 0).attr('x2', width)
        .attr('y1', function(d) {
          return facetScoreHeight + facetScoreMargin.bottom;
        }).attr('y2', function(d) {
          return facetScoreHeight + facetScoreMargin.bottom;
        })
        .style('stroke', '#ddd').style('stroke-width', 1);
  }

  $.post('/scorePalette', JSON.stringify({ getComparison: true }), function(data) {
    data = JSON.parse(data);
    var container = d3.select('#paletteScoreResults');
    container.insert('div', ':first-child').classed('container-fluid', true).html(data.html);
    var card = container.select('.scoreResult');
    card.select('.closePaletteScore')
        .on('click', function() { card.remove(); });
    console.log(data);

    // Create table of scores, ready for pasting into Excel
    var allPScores = data.paletteScores,
        allPScore_sizes = Object.keys(allPScores).sort(),
        outputRows = [];
    allPScore_sizes.forEach(function(size) {
      var paletteSets = allPScores[size],
          paletteSets_names = Object.keys(paletteSets).sort();
      paletteSets_names.forEach(function(setName) {
        var palettes = paletteSets[setName],
            palettes_names = Object.keys(palettes).sort();
        palettes_names.forEach(function(paletteName) {
          var scores = palettes[paletteName],
              scoreNames = Object.keys(scores).filter(function(d) {
                return d != "nu";
              }).sort();
          var s = scoreNames.map(function(sn) { return scores[sn]; }),
              output = s.concat([setName, size, paletteName]);
          outputRows.push(output.join('\t'));
        });
      });
    });
    console.log(outputRows.join('\n'));

    drawBarcharts(card.select('.chartArea'), data.palettes, data.paletteScores);
  });
});
