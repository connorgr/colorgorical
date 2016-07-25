function makePaletteRequest(query, callback) {
  query = JSON.stringify(query);
  callback = callback ? callback : function() {};
  d3.xhr('/color/makePalette').header('Content-Type', 'application/json')
      .post(query, callback);
}
