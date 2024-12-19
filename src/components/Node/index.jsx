// src/components/Node/index.jsx
import React from 'react';
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
  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const renderText = () => {
    if (isEditing) {
      return (
        <foreignObject
          x={node.x + basePosition.x}
          y={node.y + basePosition.y}
          width={node.width}
          height={node.height}
        >
          <textarea
            value={node.text}
            onChange={(e) => onTextChange(node.id, e.target.value)}
            onBlur={onTextBlur}
            autoFocus
            className="node-textarea"
            style={{
              width: '100%',
              height: '100%',
              padding: `${node.padding}px`,
              fontSize: `${node.fontSize}px`,
              fontFamily: node.fontFamily,
              lineHeight: '1.2',
            }}
          />
        </foreignObject>
      );
    }

    // 使用 foreignObject 来渲染 Markdown
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
            overflow: 'hidden',
            wordWrap: 'break-word'
          }}
        />
      </foreignObject>
    );
  };

  return (
    <g>
      <rect
        x={node.x + basePosition.x}
        y={node.y + basePosition.y}
        width={node.width}
        height={node.height}
        className={`rectangle ${isSelected ? 'selected' : ''} ${node.type}`}
        onClick={(e) => onNodeClick(e, node.id)}
        onDoubleClick={(e) => onNodeDoubleClick(e, node.id)}
      />
      {renderText()}
    </g>
  );
};

export default Node;