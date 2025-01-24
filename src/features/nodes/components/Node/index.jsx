// src/components/Node/index.jsx
import React, { useRef, useEffect } from 'react';
import './Node.css';
import { marked } from 'marked';

const Node = ({ 
  node, 
  basePosition, 
  isSelected, 
  isEditing,
  onNodeClick,
  onNodeDoubleClick,
  onTextChange,
  onTextBlur 
}) => {
  // 添加文本区域引用
  const textareaRef = useRef(null);
  
  // 添加自动调整高度的效果
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing, node.text]);

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const handleMouseDown = (e) => {
    // 阻止事件冒泡，这样节点的点击不会触发画布的拖拽
    e.stopPropagation();
  };

  // 新增处理键盘事件的函数
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onTextBlur();
    }
  };

  const renderText = () => {
    // 只有问题节点且处于编辑状态时才显示文本框
    if (isEditing && node.type === 'question') {
      return (
        <foreignObject
          x={node.x + basePosition.x}
          y={node.y + basePosition.y}
          width={node.width}
          height={node.height}
        >
          <textarea
            ref={textareaRef}
            value={node.text}
            onChange={(e) => onTextChange(node.id, e.target.value)}
            onBlur={onTextBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="node-textarea"
            style={{
              width: '100%',
              minHeight: '100%',
              padding: `${node.padding}px`,
              fontSize: `${node.fontSize}px`,
              fontFamily: node.fontFamily,
              lineHeight: '1.2',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
        </foreignObject>
      );
    }

    return (
      <foreignObject
        x={node.x + basePosition.x}
        y={node.y + basePosition.y}
        width={node.width}
        height={node.height}
      >
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{
            __html: marked(node.text)
          }}
          style={{
            padding: `${node.padding}px`,
            fontSize: `${node.fontSize}px`,
            fontFamily: node.fontFamily,
            lineHeight: '1.2',
          }}
        />
      </foreignObject>
    );
  };

  return (
    <g
      onMouseDown={handleMouseDown}
      onClick={(e) => onNodeClick(e, node.id)}
      onDoubleClick={(e) => onNodeDoubleClick(e, node.id)}
      className={`node ${isSelected ? 'selected' : ''}`}
    >
      <rect
        x={node.x + basePosition.x}
        y={node.y + basePosition.y}
        width={node.width}
        height={node.height}
        className={`rectangle ${isSelected ? 'selected' : ''} ${node.type}`}
      />
      {renderText()}
    </g>
  );
};

export default Node;