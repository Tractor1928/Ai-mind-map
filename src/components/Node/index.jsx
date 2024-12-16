// src/components/Node/index.jsx
import React from 'react';

const Node = ({ 
  node, 
  basePosition, 
  isSelected, 
  isEditing,
  onNodeClick,
  onNodeDoubleClick,
  onTextChange,
  onTextBlur 
}) => {
  return (
    <g>
      <rect
        x={node.x + basePosition.x}
        y={node.y + basePosition.y}
        width={200}
        height={60}
        className={`rectangle ${isSelected ? 'selected' : ''} ${node.type}`}
        fill="transparent"
        onClick={(e) => onNodeClick(e, node.id)}
        onDoubleClick={(e) => onNodeDoubleClick(e, node.id)}
      />
      {isEditing ? (
        <foreignObject
          x={node.x + basePosition.x}
          y={node.y + basePosition.y}
          width={200}
          height={60}
        >
          <input
            type="text"
            value={node.text}
            onChange={(e) => onTextChange(node.id, e.target.value)}
            onBlur={onTextBlur}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              textAlign: 'center',
              outline: 'none'
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={node.x + basePosition.x + 100}
          y={node.y + basePosition.y + 35}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {node.text}
        </text>
      )}
    </g>
  );
};

export default Node;