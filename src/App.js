// src/App.js
import React, { useEffect } from 'react';
import './App.css';
import Canvas from './components/Canvas';
import { useNodeOperations } from './hooks/useNodeOperations';
import { useCanvasOperations } from './hooks/useCanvasOperations';

function App() {
  const {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText
  } = useNodeOperations();

  const {
    basePosition,
    handleMouseDown
  } = useCanvasOperations();

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
  }, [rectangles, selectedRect]);

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

  return (
    <div className="App">
      <Canvas
        rectangles={rectangles}
        basePosition={basePosition}
        selectedRect={selectedRect}
        editingRect={editingRect}
        onMouseDown={handleMouseDown}
        onCanvasClick={handleCanvasClick}
        onNodeClick={handleRectClick}
        onNodeDoubleClick={handleRectDoubleClick}
        onTextChange={updateNodeText}
        onTextBlur={handleTextBlur}
      />
    </div>
  );
}

export default App;