// src/App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const [rectangles, setRectangles] = useState([1]); // 只存储矩形的数量
  const [selectedRect, setSelectedRect] = useState(null); // 添加新的状态
  const [texts, setTexts] = useState({}); // 新增：存储文本内容
  const [editingRect, setEditingRect] = useState(null); // 新增：当前正在编辑的矩形
  
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setRectangles(prev => [...prev, prev.length + 1]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    setTexts(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // 新增：处理文本编辑完成
  const handleTextBlur = () => {
    setEditingRect(null);
  };

  return (
    <div className="App">
      <svg className="canvas" 
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick} // 添加画布点击事件
      >
        {rectangles.map((id, index) => (
          <g key={id}>
            <rect
              x={50 + (index * 220) + basePosition.x}
              y={50 + basePosition.y}
              width={200}
              height={60}
              className={`rectangle ${selectedRect === id ? 'selected' : ''}`}
              fill="transparent"
              onClick={(e) => handleRectClick(e, id)} // 添加点击事件
              onDoubleClick={(e) => handleRectDoubleClick(e, id)}
            />
            {editingRect === id ? (
              <foreignObject
                x={50 + (index * 220) + basePosition.x}
                y={50 + basePosition.y}
                width={200}
                height={60}
              >
                <input
                  type="text"
                  value={texts[id] || ''}
                  onChange={(e) => handleTextChange(id, e.target.value)}
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
                x={50 + (index * 220) + basePosition.x + 100}
                y={50 + basePosition.y + 35}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {texts[id] || ''}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default App;