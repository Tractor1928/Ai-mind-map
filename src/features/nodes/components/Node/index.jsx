// src/components/Node/index.jsx
import React, { useRef, useEffect } from 'react';
import './Node.css';
import { marked } from 'marked';

const Node = ({ 
  node, 
  isSelected, 
  isEditing,
  onClick,
  onDoubleClick,
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
        <textarea
          ref={textareaRef}
          value={node.text}
          onChange={(e) => onTextChange?.(node.id, e.target.value)}
          onBlur={onTextBlur}
          onKeyDown={handleKeyDown}
          className="node-textarea"
          autoFocus
          placeholder="输入你的问题..."
        />
      );
    }

    // 使用 marked 渲染 Markdown
    const html = marked(node.text || '');
    return (
      <div 
        className="node-text"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`node ${isSelected ? 'selected' : ''} ${node.type}`}
    >
      <rect
        width={node.width}
        height={node.height}
        rx={5}
        className={`node-rect ${node.type}`}
      />
      <foreignObject
        width={node.width}
        height={node.height}
        className="node-content"
      >
        {renderText()}
      </foreignObject>
    </g>
  );
};

export default Node;