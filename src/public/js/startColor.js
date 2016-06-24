var startColorInput = d3.select('#startColorInput'),
    startColorAddBtn = d3.select('#addStartColor'),
    startColorAddedList = d3.select('#startColorAddedPanel');

startColorAddBtn.on('click', function() {
  var validHex = function(c) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(c);
  };
  var validRGB = function(c) {
    return /^rgb\(([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5]),\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5]),\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\)/i.test(c);
  };
  // Lab ranges:
  // L = [0,100]
  // a = [-85, 100]
  // b = [-110, 95]
  var validLab = function(c) {
    if(c.indexOf('lab(') < 0 && c.indexOf('Lab(') < 0) return false;
    c = c.replace('lab(', '').replace('Lab(', '').replace(')','').split(',');
    c = c.map(function(d) { return +d; });
    areNumbers = !c.reduce(function(cs, c) { return isNaN(c) || cs; }, false);
    return c.length == 3 && areNumbers;
  };
  function validate(c) {
    var tests = [validHex, validRGB, validLab];
    return tests.reduce(function(ts, t) { return ts || t(c); }, false);
  }


  var input = startColorInput.property('value');
  if(input === '') return;

  var isOk = validate(input);
  if(isOk) {
    var color;
    if(validHex(input)) color = d3.rgb(input);
    if(validRGB(input)) {
      var rgb = input.replace('rgb(','').replace(')','').split(',').map(function(c) { return +c; });
      color = d3.rgb(rgb[0], rgb[1], rgb[2]);
    } else if(validLab(input)) {
      var lab = input.replace('lab(','').replace(')','').split(',').map(function(c) { return +c; });
      color = d3.lab(lab[0], lab[1], lab[2]);
    }
    var li = startColorAddedList.append('li'),
        modelColor = d3.lab(color),
        mc = [modelColor.l, modelColor.a, modelColor.b].map(function(c) {
                return Math.round(c);
              }).join(',');
    li.attr('data-color', mc);
    li.append('i').attr('class', 'fa fa-trash-o')
        .on('click', function() { li.remove(); });
    li.append('span').text(' ' + input);
    li.append('span').attr('class', 'pull-right')
        .style('border', '1px solid white')
        .style('margin-top', '3px')
        .style('width', '12px')
        .style('height', '12px')
        .style('background', color);
  }
});
