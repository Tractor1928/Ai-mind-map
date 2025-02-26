import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import VirtualCanvas from './features/canvas/components/VirtualCanvas';
import { useNode } from './features/nodes/context/NodeContext';
import { useZoom } from './features/canvas/hooks/useZoom';
import { useAI } from './hooks/useAI';
import { buildContextPrompt } from './features/ai/utils/contextPrompt';
import { AI_PROMPTS } from './config/prompts';
import { Settings } from './components/Settings';

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
    handleDragStart: handleZoomDragStart,
    setTransform
  } = useZoom(window.innerWidth, window.innerHeight);

  const viewport = useMemo(() => ({
    left: -transform.x / transform.scale,
    right: (window.innerWidth - transform.x) / transform.scale,
    top: -transform.y / transform.scale,
    bottom: (window.innerHeight - transform.y) / transform.scale
  }), [transform]);

  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reasoningContent, setReasoningContent] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);

  const { generateResponse } = useAI();

  const handleRectClick = (e, id) => {
    e.stopPropagation();
    setSelectedRect(id);
    centerNode(id);
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
        
        // 清空思考过程
        setReasoningContent('');
        
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
          
          const onReasoningProgress = (reasoning) => {
            setReasoningContent(prev => prev + reasoning);
          };
          
          await generateResponse(messages, onProgress, onReasoningProgress);
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

  const handleArrowKeys = (e) => {
    if (!selectedRect || !rectangles.length) return;

    const currentNode = rectangles.find(r => r.id === selectedRect);
    if (!currentNode) return;

    let nextNode = null;

    switch (e.key) {
      case 'ArrowRight':
        // 移动到子节点
        if (currentNode.childrenIds.length > 0) {
          nextNode = rectangles.find(r => r.id === currentNode.childrenIds[0]);
        }
        break;
      case 'ArrowLeft':
        // 移动到父节点
        if (currentNode.parentId) {
          nextNode = rectangles.find(r => r.id === currentNode.parentId);
        }
        break;
      case 'ArrowUp':
        // 移动到同级上一个节点
        if (currentNode.parentId) {
          const parent = rectangles.find(r => r.id === currentNode.parentId);
          const siblings = rectangles.filter(r => r.parentId === parent.id);
          const currentIndex = siblings.findIndex(r => r.id === currentNode.id);
          if (currentIndex > 0) {
            nextNode = siblings[currentIndex - 1];
          }
        }
        break;
      case 'ArrowDown':
        // 移动到同级下一个节点
        if (currentNode.parentId) {
          const parent = rectangles.find(r => r.id === currentNode.parentId);
          const siblings = rectangles.filter(r => r.parentId === parent.id);
          const currentIndex = siblings.findIndex(r => r.id === currentNode.id);
          if (currentIndex < siblings.length - 1) {
            nextNode = siblings[currentIndex + 1];
          }
        }
        break;
      default:
        return;
    }

    if (nextNode) {
      e.preventDefault();
      setSelectedRect(nextNode.id);
      centerNode(nextNode.id);
    }
  };

  const centerNode = useCallback((nodeId) => {
    const node = rectangles.find(r => r.id === nodeId);
    if (!node) return;
    
    // 计算节点中心点
    const nodeCenterX = node.x + node.width / 2;
    const nodeCenterY = node.y + node.height / 2;
    
    // 计算需要的平移量，使节点居中
    const targetX = window.innerWidth / 2 - nodeCenterX * transform.scale;
    const targetY = window.innerHeight / 2 - nodeCenterY * transform.scale;
    
    // 使用动画平滑过渡到目标位置
    const startX = transform.x;
    const startY = transform.y;
    const startTime = performance.now();
    const duration = 300; // 动画持续时间(毫秒)

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeOutCubic 缓动函数使动画更自然
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const newX = startX + (targetX - startX) * easeProgress;
      const newY = startY + (targetY - startY) * easeProgress;
      
      setTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [rectangles, transform.scale, transform.x, transform.y, setTransform]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // 处理方向键
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleArrowKeys(e);
        return;
      }

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

  useEffect(() => {
    document.addEventListener('keydown', handleArrowKeys);
    return () => document.removeEventListener('keydown', handleArrowKeys);
  }, [selectedRect, rectangles]);

  return (
    <div className="App">
      <div className="app-controls">
        <button
          className="control-button"
          onClick={() => setShowSettings(true)}
        >
          设置
        </button>
        <button
          className="control-button"
          onClick={() => {
            // 模拟Tab键功能
            if (!selectedRect && rectangles.length === 0) {
              const firstNode = addNode(null, '', 'question');
              setEditingRect(firstNode.id);
              return;
            }
            
            const currentRect = rectangles.find(r => r.id === selectedRect);
            if (currentRect?.type === 'question') {
              return;
            }
            
            if (currentRect?.type === 'answer') {
              const newQuestionNode = addNode(currentRect, '', 'question');
              setEditingRect(newQuestionNode.id);
            }
          }}
        >
          新增节点
        </button>
        <button
          className="control-button"
          onClick={() => {
            // 模拟Delete键功能
            const currentRect = rectangles.find(r => r.id === selectedRect);
            if (currentRect?.type === 'question') {
              deleteNode(currentRect.id);
            }
          }}
        >
          删除节点
        </button>
        <button
          className="control-button reasoning-button"
          onClick={() => setShowReasoning(!showReasoning)}
        >
          {showReasoning ? '隐藏思考过程' : '显示思考过程'}
        </button>
      </div>
      <VirtualCanvas
        rectangles={rectangles}
        selectedRect={selectedRect}
        editingRect={editingRect}
        transform={transform}
        viewport={viewport}
        isDragging={isDragging}
        onRectClick={handleRectClick}
        onRectDoubleClick={handleRectDoubleClick}
        onCanvasClick={handleCanvasClick}
        onDragStart={handleDragStart}
        onZoom={handleZoom}
        onPan={handlePan}
        onTextChange={updateNodeText}
        onTextBlur={handleTextBlur}
      />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      
      {showReasoning && reasoningContent && (
        <div className="reasoning-panel">
          <h3>AI思考过程</h3>
          <div className="reasoning-content">
            {reasoningContent}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;