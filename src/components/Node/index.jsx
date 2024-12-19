// src/components/Node/index.jsx
import React from 'react';
import './Node.css';

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
  const renderText = () => {
    if (isEditing) {
      return (
        <foreignObject
          x={node.x + basePosition.x}
          y={node.y + basePosition.y}
          width={node.width}
          height={node.height}
        >
          <textarea
            value={node.text}
            onChange={(e) => onTextChange(node.id, e.target.value)}
            onBlur={onTextBlur}
            autoFocus
            className="node-textarea"
            style={{
              width: '100%',
              height: '100%',
              padding: `${node.padding}px`,
              fontSize: `${node.fontSize}px`,
              fontFamily: node.fontFamily,
              lineHeight: '1.2',
            }}
          />
        </foreignObject>
      );
    }

    return (
      <text
        x={node.x + basePosition.x + (node.width / 2)}
        y={node.y + basePosition.y + node.padding + node.fontSize}
        textAnchor="middle"
      >
        {node.lines.map((line, i) => (
          <tspan
            key={i}
            x={node.x + basePosition.x + (node.width / 2)}
            dy={i === 0 ? 0 : node.fontSize * 1.2}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <g>
      <rect
        x={node.x + basePosition.x}
        y={node.y + basePosition.y}
        width={node.width}
        height={node.height}
        className={`rectangle ${isSelected ? 'selected' : ''} ${node.type}`}
        onClick={(e) => onNodeClick(e, node.id)}
        onDoubleClick={(e) => onNodeDoubleClick(e, node.id)}
      />
      {renderText()}
    </g>
  );
};

export default Node;