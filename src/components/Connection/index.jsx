// src/components/Connection/index.jsx
import React from 'react';
import * as d3 from 'd3';

const Connection = ({ startNode, endNode, basePosition }) => {
  const linkGenerator = d3.linkHorizontal()
    .x(d => d.x)
    .y(d => d.y);

  const path = linkGenerator({
    source: {
      x: startNode.x + basePosition.x + startNode.width,
      y: startNode.y + basePosition.y + (startNode.height / 2)
    },
    target: {
      x: endNode.x + basePosition.x,
      y: endNode.y + basePosition.y + (endNode.height / 2)
    }
  });

  return (
    <path
      d={path}
      fill="none"
      stroke="#999"
      strokeWidth="1"
      markerEnd="url(#arrowhead)"
    />
  );
};

export default Connection;