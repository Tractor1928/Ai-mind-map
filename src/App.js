// src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Canvas from './components/Canvas';
import { useCanvasOperations } from './hooks/useCanvasOperations';
import { useNode } from './context/NodeContext';
import { useZoom } from './hooks/useZoom';
import VirtualCanvas from './components/VirtualCanvas';

function App() {
  const {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText
  } = useNode();

  const {
    transform,
    handleZoom,
    handlePan,
    handleDragStart: handleZoomDragStart
  } = useZoom(window.innerWidth, window.innerHeight);

  const viewport = useMemo(() => ({
    left: -transform.x / transform.scale,
    right: (window.innerWidth - transform.x) / transform.scale,
    top: -transform.y / transform.scale,
    bottom: (window.innerHeight - transform.y) / transform.scale
  }), [transform]);

  const [isDragging, setIsDragging] = useState(false);

  const handleRectClick = (e, id) => {
    e.stopPropagation();
    setSelectedRect(id);
  };

  const handleCanvasClick = () => {
    setSelectedRect(null);
  };

  const handleRectDoubleClick = (e, id) => {
    e.stopPropagation();
    setEditingRect(id);
  };

  const handleTextBlur = () => {
    setEditingRect(null);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    handleZoomDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentRect = rectangles.find(r => r.id === selectedRect);
        addNode(currentRect);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rectangles, selectedRect, addNode]);

  useEffect(() => {
    document.addEventListener('mouseup', handleDragEnd);
    return () => document.removeEventListener('mouseup', handleDragEnd);
  }, []);

  return (
    <div className="App" onWheel={handleZoom}>
      <svg 
        className={`canvas ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleDragStart}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          <VirtualCanvas
            nodes={rectangles}
            links={rectangles.filter(r => r.parentId).map(r => ({
              source: rectangles.find(n => n.id === r.parentId),
              target: r
            }))}
            viewport={viewport}
            scale={transform.scale}
            selectedRect={selectedRect}
            editingRect={editingRect}
            onNodeClick={handleRectClick}
            onNodeDoubleClick={handleRectDoubleClick}
            onTextChange={updateNodeText}
            onTextBlur={handleTextBlur}
          />
        </g>
      </svg>
    </div>
  );
}

export default App;