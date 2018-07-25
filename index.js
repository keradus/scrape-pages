const config = {
  scrape: {
    name: "mainpage",
    download: "mainpage",
    parse: "batchID",
    scrapeEach: [
      {
        name: "grid",
        download: "batchPage{batchID}",
        scrapeNext: {
          name: "id-grabber",
          parse: "batchID"
        },
        scrapeEach: [
          {
            name: "tag",
            parse: "span.tag"
          },
          {
            name: "parse-image-page",
            parse: "li a.images",
            scrapeEach: [
              {
                name: "image-page",
                download: "imagepage{imageID}",
                parse: "img",
                scrapeEach: [
                  {
                    name: "image",
                    download: "{src}"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

const downloadText = configStep => {
  const download = configStep.download ? "Download" : "Identity";
  const content = configStep.parse ? "html" : "file";
  return download;
};
const parseText = configStep => {
  if (configStep.parse) {
    const content = "html";
    return `Parse ${content}`;
  } else {
    return "Identity";
  }
};

window.onload = () => {
  // for quick switching diagonal
  const get = {
    x: "y",
    y: "x",
    width: "height",
    height: "width"
  };

  const margin = { top: 20, right: 50, bottom: 100, left: 20 };
  // dynamically set these later
  let width = 500,
    height = 500;
  // elements
  const rectNode = { width: 120, height: 60, textMargin: 5 };
  const baseSvg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);
  const svgGroup = baseSvg
    .append("g")
    .attr("class", "drawarea")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const nodeGroup = svgGroup.append("g").attr("id", "nodes");
  const linkGroup = svgGroup.append("g").attr("id", "links");
  const diagonal = d3
    .linkHorizontal()
    .x(d => d[get.x])
    .y(d => d[get.y]);

  const root = d3.hierarchy(config.scrape, step => [
    ...(step.scrapeEach || []),
    ...(step.scrapeNext ? [step.scrapeNext] : [])
  ]);
  const treemap = d3.tree().size([400, 250]);
  treemap(root);

  // update function, call it on text box change
  const update = root => {
    const traverse = (root, func, i = 0) => {
      func(root, i);
      if (root.children) {
        for (let i = 0; i < root.children.length; i++) {
          traverse(root.children[i], func, i);
        }
      }
    };
    traverse(root, (d, i) => {
      d.y = d.depth * (rectNode[get.height] * 1.5);
      if (d.y > width) width = d.y + rectNode.width;
    });
    const descendants = root.descendants();
    const links = root.links();

    baseSvg
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom);

    // Nodes
    gNode = nodeGroup
      .selectAll("g.node")
      .data(descendants)
      .enter()
      .append("g")
      .attr(
        "transform",
        d => `translate(${d[get.x]}, ${d[get.y] - rectNode.height / 2})`
      );

    gNode
      .append("rect")
      .classed("node", true)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", rectNode.width)
      .attr("height", rectNode.height);

    // Labels
    const labelDiv = gNode
      .append("foreignObject")
      .classed("label", true)
      .attr("width", () => rectNode.width)
      .attr("height", () => rectNode.height)
      .append("xhtml:div");
    labelDiv.classed("scrape-step", true);

    labelDiv
      .append("div")
      .classed("name", true)
      .text(d => d.data.name);
    labelDiv
      .append("div")
      .classed("download", true)
      .text(d => downloadText(d.data));

    labelDiv
      .append("div")
      .classed("parse", true)
      .text(d => parseText(d.data));

    // Links
    linkGroup
      .selectAll("path.link")
      .data(root.links())
      .enter()
      .append("g")
      .classed("link", true)
      // .append("path")
      // .attr("d", diagonal);
      .append("line")
      .attr("x1", d => d.source[get.x] + rectNode.width)
      .attr("y1", d => d.source[get.y])
      .attr("x2", d => d.target[get.x])
      .attr("y2", d => d.target[get.y]);
  };
  update(root);
  // const descendants = root.descendants();
  // const links = root.links();

  // const diagonal = d3
  // .linkHorizontal()
  // .x(d => d.y)
  // .y(d => d.x);

  // // Nodes
  // d3.select("svg g.nodes")
  // .selectAll("circle.node")
  // .data(root.descendants())
  // .enter()
  // .append("g")
  // .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
  // .append("circle")
  // .classed("node", true)
  // // .attr("cx", d => d.x)
  // // .attr("cy", d => d.y)
  // .attr("r", 4);

  // // Links
  // d3.select("svg g.links")
  // .selectAll("path.link")
  // .data(root.links())
  // .enter()
  // .append("g")
  // .append("path")
  // .classed("link", true)
  // .attr("d", diagonal);

  // // Labels
  // d3.select("svg g.labels")
  // .selectAll("text")
  // .data(descendants)
  // .enter()
  // .append("text")
  // .classed("label", true)
  // .attr("alignment-baseline", "middle")
  // .attr("x", d => d.y)
  // .attr("y", d => d.x)
  // .text(d => d.data.name)
  // .each(function(d, i) {
  // descendants[i].bb = this.getBBox();
  // });

  // // Label Boxes
  // const padding = 6;
  // d3.select("svg g.label-boxes")
  // .selectAll("text")
  // .data(descendants)
  // .enter()
  // // .append("g")
  // // .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
  // .append("rect")
  // .classed("box", true)
  // .attr("x", (d, i) => d.y - descendants[i].bb.width / 2 - padding / 2)
  // .attr("y", (d, i) => d.x - descendants[i].bb.height + padding / 2)
  // .attr("width", (d, i) => descendants[i].bb.width + padding)
  // .attr("height", (d, i) => descendants[i].bb.height + padding);
};
