// src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import VirtualCanvas from './features/canvas/components/VirtualCanvas';
import { useNode } from './features/nodes/context/NodeContext';
import { useZoom } from './features/canvas/hooks/useZoom';
import AITest from './components/AITest';

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
    <div className="App">
      <AITest />
      {/* 暂时注释掉其他内容
      <div 
        className={`canvas ${isDragging ? 'dragging' : ''}`}
        onWheel={handleZoom}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onClick={handleCanvasClick}
      >
        ...
      </div>
      */}
    </div>
  );
}

export default App;