import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import VirtualCanvas from './features/canvas/components/VirtualCanvas';
import { useNode } from './features/nodes/context/NodeContext';
import { useZoom } from './features/canvas/hooks/useZoom';
import { useAI } from './hooks/useAI';
import { buildContextPrompt } from './features/ai/utils/contextPrompt';
import { AI_PROMPTS } from './config/prompts';

function App() {
  const {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText,
    deleteNode
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
    // 检查是否是问题节点
    const node = rectangles.find(r => r.id === id);
    if (node?.type === 'question') {
      setEditingRect(id);
    }
  };

  const handleTextBlur = async () => {
    if (editingRect) {
      const editedNode = rectangles.find(r => r.id === editingRect);
      if (editedNode && editedNode.type === 'question') {
        if (!editedNode.text.trim()) {
          setEditingRect(null);
          return;
        }
        
        // 获取上下文提示词
        const contextPrompt = buildContextPrompt(editedNode, rectangles);
        
        // 创建带有加载提示的回答节点
        const answerNode = addNode(editedNode, '正在思考中...', 'answer');
        
        try {
          const messages = [
            { role: 'system', content: AI_PROMPTS.system },
            // 如果有上下文，添加上下文提示
            ...(contextPrompt ? [{ role: 'system', content: contextPrompt }] : []),
            { role: 'user', content: editedNode.text }
          ];
          
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
    const handleKeyDown = async (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        // 如果没有选中节点且画布为空，创建第一个问题节点
        if (!selectedRect && rectangles.length === 0) {
          const firstNode = addNode(null, '', 'question');
          setEditingRect(firstNode.id);
          return;
        }
        
        // 如果选中的是问题节点，不做任何操作
        const currentRect = rectangles.find(r => r.id === selectedRect);
        if (currentRect?.type === 'question') {
          return;
        }
        
        // 如果选中的是回答节点，创建新的问题节点
        if (currentRect?.type === 'answer') {
          const newQuestionNode = addNode(currentRect, '', 'question');
          setEditingRect(newQuestionNode.id);
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        
        // 如果有选中的节点且是问题节点,则删除
        const currentRect = rectangles.find(r => r.id === selectedRect);
        if (currentRect?.type === 'question') {
          deleteNode(currentRect.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rectangles, selectedRect, addNode, setEditingRect, deleteNode]);

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
      <div className="hint-text">
        Press Tab and feel free to ask
      </div>
    </div>
  );
}

export default App;