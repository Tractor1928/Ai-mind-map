// src/components/Canvas/index.jsx
import React from 'react';
import Node from '../Node';
import Connection from '../Connection';

const Canvas = ({
  rectangles,
  basePosition,
  selectedRect,
  editingRect,
  onMouseDown,
  onCanvasClick,
  onNodeClick,
  onNodeDoubleClick,
  onTextChange,
  onTextBlur
}) => {
  return (
    <svg 
      className="canvas"
      onMouseDown={onMouseDown}
      onClick={onCanvasClick}
    >
      {rectangles.map((rect) => (
        rect.parentId && (
          <Connection
            key={`line-${rect.id}`}
            startNode={rectangles.find(r => r.id === rect.parentId)}
            endNode={rect}
            basePosition={basePosition}
          />
        )
      ))}
      
      {rectangles.map((rect) => (
        <Node
          key={rect.id}
          node={rect}
          basePosition={basePosition}
          isSelected={selectedRect === rect.id}
          isEditing={editingRect === rect.id}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onTextChange={onTextChange}
          onTextBlur={onTextBlur}
        />
      ))}
    </svg>
  );
};

export default Canvas;