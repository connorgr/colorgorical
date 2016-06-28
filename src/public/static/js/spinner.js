(function() {
  function shuffle(array) {
    var m = array.length, t, i;

    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  var colors = [ ['#3c3f85','#b6c5f5','#257950','#8dd5b3','#75878c'],
                 ['#6b62a5','#afc6fe','#de91d9','#791c76','#2c7ea9'],
                 ['#ed820a','#871d32','#d0c3c6','#807477','#fe5360'],
                 ['#2c5c39','#a7d297','#2db45c','#c0d122']
               ];

  var svg = d3.select('svg'),
      letter = svg.select('path'),
      marks = svg.selectAll('polygon').style('stroke', '#333').style('stroke-linecap', 'round'),
      nodes = [];

  marks.each(function() { nodes.push(d3.select(this).node()); });

  nodes = shuffle(nodes);
  nodes.forEach(function(d,i) {
      var thisEl = d3.select(d);
      thisEl.style('fill', colors[0][ i%colors[0].length ])
          .style('stroke', '#333')
          .style('stroke-width', 1)
          .style('shape-rendering', 'geometricPrecision');
    });

  letter.style('stroke', '#333')
      .style('fill', '#eee')
      .style('opacity', 0);

  var colorIter = 1;
  function colorFn() {
    cs = colors[colorIter % colors.length];
    nodes = shuffle(nodes);
    nodes.forEach(function(d,i) {
      var thisEl = d3.select(d);
      thisEl.transition()
          .delay(Math.random() * 2000)
          .duration(2500)
          .style('fill', cs[ i%cs.length ])
          .style('opacity', 1);
    });
    colorIter = colorIter + 1;
  }

  setInterval(colorFn, 4000);
})();
