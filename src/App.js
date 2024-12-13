// src/App.js
import React, { useState } from 'react';
import './App.css';
import { RectNode, NODE_TYPES } from './models/RectNode';

function App() {
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const [rectangles, setRectangles] = useState([]); // 修改为对象数组
  const [selectedRect, setSelectedRect] = useState(null);
  const [editingRect, setEditingRect] = useState(null);
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        const nodeType = rectangles.length % 2 === 0 ? 
          NODE_TYPES.QUESTION : 
          NODE_TYPES.ANSWER;
        
        const currentRect = rectangles.find(r => r.id === selectedRect);
        
        let newX, newY, newLevel;
        if (currentRect) {
          newLevel = currentRect.level + 1;
          newX = 50 + (newLevel * 250);
          
          // 获取当前选中节点的所有子节点
          const childNodes = rectangles.filter(r => r.parentId === currentRect.id);
          
          // 计算新的Y坐标
          if (childNodes.length === 0) {
            // 如果是第一个子节点，直接对齐父节点
            newY = currentRect.y;
          } else {
            // 重新计算所有子节点的位置
            const totalHeight = (childNodes.length + 1) * 80; // +1 为新节点预留空间
            const startY = currentRect.y - (totalHeight / 2) + 40; // 40是节点高度的一半
            
            // 更新现有子节点的位置
            const updatedRects = [...rectangles];
            childNodes.forEach((child, index) => {
              const rect = updatedRects.find(r => r.id === child.id);
              if (rect) {
                rect.y = startY + (index * 80);
              }
            });
            setRectangles(updatedRects);
            
            // 新节点的位置
            newY = startY + (childNodes.length * 80);
          }
          
          // 递归更新所有受影响的节点位置
          const updateDescendantsPosition = (nodeId, offsetY) => {
            const descendants = rectangles.filter(r => r.parentId === nodeId);
            descendants.forEach(desc => {
              desc.y += offsetY;
              updateDescendantsPosition(desc.id, offsetY);
            });
          };
          
          // 如果需要，更新当前节点所有后代节点的位置
          updateDescendantsPosition(currentRect.id, 0);
        } else {
          // 第一个节点的位置保持不变
          newLevel = 0;
          newX = 50;
          newY = 50;
        }
        
        const newNode = new RectNode(
          rectangles.length + 1,
          newX,
          newY,
          '',
          nodeType
        );
        newNode.setLevel(newLevel);

        if (currentRect) {
          newNode.setParent(currentRect.id);
          setRectangles(prev => prev.map(rect => {
            if (rect.id === currentRect.id) {
              rect.addChild(newNode.id);
            }
            return rect;
          }));
        }

        setRectangles(prev => [...prev, newNode]);
        setSelectedRect(newNode.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rectangles, selectedRect]);

  // 保持原有的移动处理逻辑
  const handleMouseDown = (e) => {
    const startX = e.clientX - basePosition.x;
    const startY = e.clientY - basePosition.y;

    const handleMouseMove = (e) => {
      setBasePosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 添加矩形点击处理函数
  const handleRectClick = (e, id) => {
    e.stopPropagation(); // 防止事件冒泡到 svg
    setSelectedRect(id);
  };

  // 添加画布点击处理函数，用于取消选择
  const handleCanvasClick = () => {
    setSelectedRect(null);
  };

  // 新增：处理双击事件，激活编辑模式
  const handleRectDoubleClick = (e, id) => {
    e.stopPropagation();
    setEditingRect(id);
  };

  // 新增：处理文本变化
  const handleTextChange = (id, value) => {
    setRectangles(prev => prev.map(rect =>
      rect.id === id ? { ...rect, text: value } : rect
    ));
  };

  // 新增：处理文本编辑完成
  const handleTextBlur = () => {
    setEditingRect(null);
  };

  return (
    <div className="App">
      <svg className="canvas" 
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
      >
         {/* 渲染连接线 */}
         {rectangles.map((rect) => (
            rect.parentId && (
              <path
                key={`line-${rect.id}`}
                d={`
                  M ${rectangles.find(r => r.id === rect.parentId).x + basePosition.x + 200} ${rectangles.find(r => r.id === rect.parentId).y + basePosition.y + 30}
                  C ${rectangles.find(r => r.id === rect.parentId).x + basePosition.x + 250} ${rectangles.find(r => r.id === rect.parentId).y + basePosition.y + 30},
                    ${rect.x + basePosition.x - 50} ${rect.y + basePosition.y + 30},
                    ${rect.x + basePosition.x} ${rect.y + basePosition.y + 30}
                `}
                fill="none"
                stroke="#999"
                strokeWidth="1"
              />
            )
          ))}
      
        {rectangles.map((rect) => (
          <g key={rect.id}>
            <rect
              x={rect.x + basePosition.x}
              y={rect.y + basePosition.y}
              width={200}
              height={60}
              className={`rectangle ${selectedRect === rect.id ? 'selected' : ''} ${rect.type}`}
              fill="transparent"
              onClick={(e) => handleRectClick(e, rect.id)}
              onDoubleClick={(e) => handleRectDoubleClick(e, rect.id)}
            />
            {editingRect === rect.id ? (
              <foreignObject
                x={rect.x + basePosition.x}
                y={rect.y + basePosition.y}
                width={200}
                height={60}
              >
                <input
                  type="text"
                  value={rect.text}
                  onChange={(e) => handleTextChange(rect.id, e.target.value)}
                  onBlur={handleTextBlur}
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
                x={rect.x + basePosition.x + 100}
                y={rect.y + basePosition.y + 35}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {rect.text}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default App;