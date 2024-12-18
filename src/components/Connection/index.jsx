// src/components/Connection/index.jsx
import React from 'react';

const Connection = ({ startNode, endNode, basePosition }) => {
  return (
    <path
      d={`
        M ${startNode.x + basePosition.x + 200} ${startNode.y + basePosition.y + 30}
        C ${startNode.x + basePosition.x + 220} ${startNode.y + basePosition.y + 30},
          ${endNode.x + basePosition.x - 20} ${endNode.y + basePosition.y + 30},
          ${endNode.x + basePosition.x} ${endNode.y + basePosition.y + 30}
      `}
      fill="none"
      stroke="#999"
      strokeWidth="1"
    />
  );
};

export default Connection;