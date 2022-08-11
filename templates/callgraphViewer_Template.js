(function () {

  var nodeElements = [];
  var edgeElements = [];
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [{
        selector: "node",
        css: {
          "label": "data(id)",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": "data(faveColor)"
        }
      },
      {
        selector: "edge",
        css: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle"
        }
      }
    ],  
    elements: {

      nodes: nodeElements,
      edges: edgeElements
    },
  });
  cy.layout({
      name: 'klay'
  }).run();
}());