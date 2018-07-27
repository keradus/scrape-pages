const traverse = (root, func, i = 0) => {
  func(root, i);
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      traverse(root.children[i], func, i);
    }
  }
};
const downloadText = configStep => {
  const download = configStep.download ? "Download" : "identity(x) = x";
  const content = configStep.parse ? "HTML" : "file";
  return download;
};
const parseText = configStep => {
  if (configStep.parse) {
    const content = configStep.parse.expect.toUpperCase();
    return `Parse ${content}`;
  } else {
    return "identity(x) = x";
  }
};

const update = ({
  rectNode,
  get,
  initialWidth,
  initialHeight,
  baseSvg,
  margin,
  nodeGroup,
  linkGroup,
  diagonal
}) => config => {
  let width = initialWidth,
    height = initialHeight;
  const arrowSize = 12;
  const downloadToParse = 20;

  const root = d3.hierarchy(config.scrape, step => [
    ...(step.scrapeEach || []),
    ...(step.scrapeNext ? [step.scrapeNext] : [])
  ]);
  const treemap = d3.tree().size([500, initialWidth]);
  treemap(root);
  traverse(root, (d, i) => {
    d.y = d.depth * (rectNode[get.height] * 1.5);
    // d.x = d.x + d.depth * 17 // make arrow start at next parse
    if (d.y + rectNode.width > width) width = d.y + rectNode.width;
    if (d.x + rectNode.height > height) height = d.x;
  });
  const descendants = root.descendants().sort((a, b) => b.y - a.y); // sort for use w/ scrapeNext
  const links = root.links().map(d => ({
    ...d,
    source: {
      ...d.source,
      y: d.source.y + rectNode.width, // make the line start after the rectangle
      x: d.source.x + downloadToParse
    },
    target: {
      ...d.target,
      y: d.target.y - arrowSize, // space for arrow
      x: d.target.x
    }
  }));
  const incrementers = descendants.filter(
    d => d.data.download && d.data.download.increment
  );

  baseSvg
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

  // Nodes
  const gNodeAll = nodeGroup.selectAll("g").data(descendants);

  const gNode = gNodeAll
    .enter()
    .append("g")
    .merge(gNodeAll)
    .attr(
      "transform",
      d => `translate(${d[get.x]}, ${d[get.y] - rectNode.height / 2})`
    );
  gNodeAll.exit().remove();

  // Labels
  const labelDiv = gNode
    .merge(gNodeAll)
    .append("foreignObject")
    .classed("label", true)
    .attr("width", rectNode.width)
    .attr("height", rectNode.height)
    .append("xhtml:div")
    .classed("scrape-step", true)
    .attr("title", d => d.data.name);
  labelDiv
    .append("div")
    .classed("name", true)
    .text(d => d.data.name);
  labelDiv
    .append("div")
    .classed("download", true)
    .classed("identity", d => !d.data.download)
    .text(d => downloadText(d.data));
  labelDiv
    .append("div")
    .classed("parse", true)
    .classed("identity", d => !d.data.parse)
    .text(d => parseText(d.data));

  // Increment Links
  const curveHeight = 30;
  const curvePull = downloadToParse;
  gNode
    .filter(d => d.data.download && d.data.download.increment)
    .append("g")
    .classed("link", true)
    .append("path")
    .attr(
      "d",
      d =>
        `M ${rectNode.width} ${rectNode.height / 2 + downloadToParse}
      C ${rectNode.width + curvePull} ${rectNode.height / 2 +
          downloadToParse} ${rectNode.width +
          curvePull * 2} ${-curveHeight} ${rectNode.width / 2} ${-curveHeight}
      C ${-curvePull - arrowSize - 10} ${-curveHeight} ${-curvePull -
          arrowSize} ${rectNode.height / 2} ${-arrowSize} ${rectNode.height /
          2}`
    );
  // scrapeNext Links
  // sort descendants by y
  // for scrapeNext, find max x of y's that are greater than it

  // Links
  const linksAll = linkGroup.selectAll("path").data(links);
  linksAll
    .enter()
    .append("g")
    .merge(linksAll)
    .classed("link", true)
    .append("path")
    .attr("d", diagonal)
    .attr("marker-end", "url(#end-arrow)");
  linksAll.exit().remove();
};

window.onload = () => {
  // for quick switching diagonal
  const get = {
    x: "y",
    y: "x",
    width: "height",
    height: "width"
  };

  const margin = { top: 0, right: 20, bottom: 100, left: 20 };
  // dynamically set these later
  let width = 200;
  height = 100;
  // elements
  const rectNode = { width: 140, height: 75, textMargin: 5 };
  const baseSvg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);
  const svgGroup = baseSvg
    .append("g")
    .attr("class", "drawarea")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  const defsGroup = baseSvg.append("svg:defs");
  const defs = {
    arrow: defsGroup
      .append("marker")
      .attr("id", "end-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .attr("class", "arrow")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
  };

  const nodeGroup = svgGroup.append("g").attr("id", "nodes");
  const linkGroup = svgGroup.append("g").attr("id", "links");
  const diagonal = d3
    .linkHorizontal()
    .x(d => d[get.x])
    .y(d => d[get.y]);

  // update function, call it on text box change
  const updater = update({
    rectNode,
    get,
    initialWidth: width,
    initialHeight: height,
    baseSvg,
    margin,
    nodeGroup,
    linkGroup,
    diagonal
  });
  updater(config);

  const userInput = document.querySelector("#config-input");
  userInput.placeholder = JSON.stringify(config, null, 2);
  const updateFromInput = e => {
    try {
      const newConfig = JSON.parse(e.target.value);
      updater(newConfig);
    } catch (e) {
      if (e.name !== "SyntaxError") throw e;
    }
  };
  userInput.onchange = updateFromInput;
  userInput.onkeyup = updateFromInput;
  const inputContainer = document.getElementById('user-input')

  const hideButton = document.getElementById('hide-button')
  let configOpen = true
  hideButton.onclick = () => {
    configOpen = !configOpen
    inputContainer.className = configOpen ? '' : 'hidden'
  }
};
