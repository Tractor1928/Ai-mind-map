
// src/App.js
import React, { useState, useRef } from 'react';
import NodeList from './components/NodeList';
import AIHandler from './handlers/AIHandler';

function App() {
  const [nodes, setNodes] = useState([{ id: 1, text: '初始节点', children: [] }]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const canvasRef = useRef(null);
  const startPosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const addNode = (parentId) => {
    setNodes((prevNodes) => {
      const addNodeRecursive = (nodes) => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            const childCount = node.children.length + 1;
            const newNode = { id: prevNodes.length + 1, text: `${node.text} ${childCount}`, children: [] };
            return { ...node, children: [...node.children, newNode] };
          } else {
            return { ...node, children: addNodeRecursive(node.children) };
          }
        });
      };
      return addNodeRecursive(prevNodes);
    });
  };

  const generateAnswer = async (parentId, text) => {
    const answer = await AIHandler(text);
    setNodes((prevNodes) => {
      const addNodeRecursive = (nodes) => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            const childCount = node.children.length + 1;
            const newNode = { id: prevNodes.length + 1, text: `${answer} ${childCount}`, children: [] };
            return { ...node, children: [...node.children, newNode] };
          } else {
            return { ...node, children: addNodeRecursive(node.children) };
          }
        });
      };
      return addNodeRecursive(prevNodes);
    });
  };

  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(nodeId);
  };

  // 画布拖动逻辑...
  const handleMouseDown = (event) => {
    isDragging.current = true;
    startPosition.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event) => {
    if (!isDragging.current) return;

    const dx = event.clientX - startPosition.current.x;
    const dy = event.clientY - startPosition.current.y;

    if (canvasRef.current) {
      canvasRef.current.scrollLeft -= dx;
      canvasRef.current.scrollTop -= dy;
    }

    startPosition.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="App"
      ref={canvasRef}
      style={{ overflow: 'auto', width: '100vw', height: '100vh' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <h1>标题</h1>
      <NodeList
        nodes={nodes}
        onAddNode={addNode}
        onGenerateAnswer={generateAnswer}
        onSelectNode={handleSelectNode}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
}

export default App;