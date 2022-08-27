(function () {

  var nodeElements = [{"data":{"id":"Cy0W1FoorPEInVMAiA9viQ#052","fullMethod":"test.call_graph.future.FutureTaskChild:<init>(java.lang.Runnable,java.lang.Object)","simpleMethod":"<init>"}},{"data":{"id":"Jk_9eGlUHn22BJ2T2Np4EA#029","fullMethod":"test.call_graph.future.TestFuture:test5()","simpleMethod":"test5"}},{"data":{"id":"Jk_9eGlUHn22BJ2T2Np4EA#029","fullMethod":"test.call_graph.future.TestFuture:test5()","simpleMethod":"test5"}},{"data":{"id":"xD5WEBEuKX3ZNhOpTRModg#029","fullMethod":"test.call_graph.future.TestFuture:test6()","simpleMethod":"test6"}},{"data":{"id":"xD5WEBEuKX3ZNhOpTRModg#029","fullMethod":"test.call_graph.future.TestFuture:test6()","simpleMethod":"test6"}}];
  var edgeElements =[{"data":{"id":"Jk_9eGlUHn22BJ2T2Np4EA#029_Cy0W1FoorPEInVMAiA9viQ#052","source":"Jk_9eGlUHn22BJ2T2Np4EA#029","target":"Cy0W1FoorPEInVMAiA9viQ#052","callerClass":"test.call_graph.future.TestFuture","linenum":47}},{"data":{"id":"xD5WEBEuKX3ZNhOpTRModg#029_Cy0W1FoorPEInVMAiA9viQ#052","source":"xD5WEBEuKX3ZNhOpTRModg#029","target":"Cy0W1FoorPEInVMAiA9viQ#052","callerClass":"test.call_graph.future.TestFuture","linenum":57}}];
  const cyPopupDiv = document.getElementById('cyPopup');
  const vscode = acquireVsCodeApi();
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [{
        selector: "node",
        css: {
          "label": "data(simpleMethod)",
          "text-valign": "bottom",
          "text-halign": "center",
          "font-size":20,
          //"background-color": "data(faveColor)",
          "color":"#F5F5F5",
          "height":13,
          "width":13,
        }
      },
      {
        selector: "edge",
        css: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          'width':2,
        }
      }
    ],  
    elements: {

      nodes: nodeElements,
      edges: edgeElements
    },
    pan: {
      x: 0,
      y: 0
    },
    minZoom: 0,
    maxZoom: 4,
    wheelSensitivity: 0.10,
  });
  cy.layout({
      name: 'klay',
      zoom:1,      
      nodeDimensionsIncludeLabels: true,
      fit: true, // Whether to fit
      padding: 20, // Padding on fit
      animate: false, // Whether to transition the node positions
      animateFilter: function( node, i ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
      animationDuration: 500, // Duration of animation in ms if enabled
      animationEasing: undefined, // Easing of animation if enabled
      transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
      ready: undefined, // Callback on layoutready
      stop: undefined, // Callback on layoutstop
      klay: {
        // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
        addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
        aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
        borderSpacing: 20, // Minimal amount of space to be left to the border
        compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
        crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
        /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
        INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
        cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
        /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
        INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
        direction: 'UNDEFINED', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
        /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
        edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
        edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
        feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
        fixedAlignment: 'LEFTUP', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
        /* NONE Chooses the smallest layout from the four possible candidates.
        LEFTUP Chooses the left-up candidate from the four possible candidates.
        RIGHTUP Chooses the right-up candidate from the four possible candidates.
        LEFTDOWN Chooses the left-down candidate from the four possible candidates.
        RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
        BALANCED Creates a balanced layout from the four possible candidates. */
        inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
        layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
        linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
        mergeEdges: true, // Edges that have no ports are merged so they touch the connected nodes at the same points.
        mergeHierarchyCrossingEdges: false, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
        nodeLayering:'NETWORK_SIMPLEX', // Strategy for node layering.
        /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
        LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
        INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
        nodePlacement:'SIMPLE', // Strategy for Node Placement
        /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
        LINEAR_SEGMENTS Computes a balanced placement.
        INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
        SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
        randomizationSeed: 2, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
        routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
        separateConnectedComponents: true, // Whether each connected component should be processed separately
        spacing: 60, // Overall setting for the minimal amount of space to be left between objects
        thoroughness: 7 // How much effort should be spent to produce a nice layout..      
      }
  }).run();
  cy.center();
  cy.on('mouseover', 'node', function (evt) {
    evt.cy.container().style.cursor = 'pointer';
    doShowPopup = true;
    setTimeout(showPopup, 500, evt);
  });
  cy.on('mouseout', 'node', function (evt) {
    evt.cy.container().style.cursor = 'default';
    hidePopup();
  });

  cy.on('click', 'edge', function (evt) {
    console.log(evt.target.data());
    openFileInVsCode(evt.target.data().callerClass, evt.target.data().linenum);
  });

  function showPopup(evt) {
    if (doShowPopup) {
      cyPopupDiv.innerHTML = evt.target.data().fullMethod;
      const top = String(parseInt(evt.renderedPosition.y)) + 'px';
      const left = String(parseInt(evt.renderedPosition.x)) + 'px';
      cyPopupDiv.style.top = top;
      cyPopupDiv.style.left = left;
      cyPopupDiv.style.display = 'block';
    }
  }

  function hidePopup() {
    cyPopupDiv.style.display = 'none';
    doShowPopup = false;
  }  

  function openFileInVsCode(callerClass, linenum) {
    vscode.postMessage({
      command: 'gotoLinenumber',
      callerClass: callerClass,
      linenum: linenum
    });
  }  
}());