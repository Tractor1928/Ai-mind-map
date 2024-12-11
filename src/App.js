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
        
        const newNode = new RectNode(
          rectangles.length + 1,
          50 + (rectangles.length * 220),
          50,
          '',  // 默认文本
          nodeType  // 设置节点类型
        );
        setRectangles(prev => [...prev, newNode]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rectangles.length]);

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

  // ��增：处理文本变化
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