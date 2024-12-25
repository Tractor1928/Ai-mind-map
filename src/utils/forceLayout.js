import * as d3 from 'd3';

export const createForceLayout = (nodes, links) => {
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(200)
    )
    .force("charge", d3.forceManyBody()
      .strength(-1000)
    )
    .force("collide", d3.forceCollide()
      .radius(d => Math.sqrt(d.width * d.height) / 2 + 50)
    )
    .force("x", d3.forceX().strength(0.1))
    .force("y", d3.forceY().strength(0.1));

  // 运行模拟
  for (let i = 0; i < 300; ++i) simulation.tick();
  
  return nodes;
}; 