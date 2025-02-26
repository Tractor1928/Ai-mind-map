// src/components/Connection/index.jsx
import React from 'react';
import * as d3 from 'd3';
import './Connection.css';

const Connection = ({ startNode, endNode, basePosition }) => {
  // 计算起点和终点
  const startX = startNode.x + basePosition.x + startNode.width;
  const startY = startNode.y + basePosition.y + (startNode.height / 2);
  const endX = endNode.x + basePosition.x;
  const endY = endNode.y + basePosition.y + (endNode.height / 2);
  
  // 计算控制点，使曲线更平滑
  const dx = endX - startX;
  const controlPointOffset = Math.min(Math.max(dx * 0.3, 50), 150); // 控制点偏移量，确保有足够的曲度
  
  // 使用贝塞尔曲线创建更平滑的连接
  const path = `
    M ${startX},${startY}
    C ${startX + controlPointOffset},${startY}
      ${endX - controlPointOffset},${endY}
      ${endX},${endY}
  `;

  return (
    <path
      d={path}
      fill="none"
      stroke="#999"
      strokeWidth="1.5"
      strokeDasharray={endNode.type === 'answer' ? "none" : "5,5"} // 问题节点使用虚线
      markerEnd="url(#arrowhead)"
      className="connection-path"
    />
  );
};

export default Connection;