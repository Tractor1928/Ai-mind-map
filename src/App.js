import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import VirtualCanvas from './features/canvas/components/VirtualCanvas';
import { useNode } from './features/nodes/context/NodeContext';
import { useZoom } from './features/canvas/hooks/useZoom';
import { useAI } from './hooks/useAI';

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

  const { generateResponse } = useAI();

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

  const handleTextBlur = async () => {
    if (editingRect) {
      const editedNode = rectangles.find(r => r.id === editingRect);
      if (editedNode && editedNode.type === 'question') {
        console.log('问题节点编辑完成:', editedNode.text);
        
        // 创建一个带有���载提示的回答节点
        const answerNode = addNode(editedNode, '正在思考中...', 'answer');
        
        try {
          const messages = [
            { role: 'system', content: '你是一个AI助手，请简洁清晰地回答问题' },
            { role: 'user', content: editedNode.text }
          ];
          
          // 添加流式响应处理
          let currentResponse = '';
          const onProgress = (content) => {
            currentResponse += content;
            updateNodeText(answerNode.id, currentResponse);
          };
          
          await generateResponse(messages, onProgress);
        } catch (error) {
          console.error('AI 回答生成失败:', error);
          updateNodeText(answerNode.id, '抱歉，回答生成失败');
        }
      }
    }
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
      <div className="split-layout">
        <div className="mindmap-container">
          <svg 
            className={`canvas ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleDragStart}
            onWheel={handleZoom}
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
      </div>
    </div>
  );
}

export default App;