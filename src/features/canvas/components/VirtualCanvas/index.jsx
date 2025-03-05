import React, { useMemo, useRef, useEffect } from 'react';
import Node from '../../../nodes/components/Node';
import Connection from '../Connection';
import { isNodeVisible } from '../../utils/viewport';
import './VirtualCanvas.css';

const VirtualCanvas = ({
  rectangles,
  transform,
  viewport,
  isDragging,
  selectedRect,
  editingRect,
  onRectClick,
  onRectDoubleClick,
  onCanvasClick,
  onDragStart,
  onZoom,
  onPan,
  onTextChange,
  onTextBlur,
  onNodeHeightChange,
  onNodeWidthChange
}) => {
  const nodes = rectangles;
  const links = rectangles.filter(r => r.parentId).map(r => ({
    source: rectangles.find(n => n.id === r.parentId),
    target: r
  }));
  
  // 添加对SVG元素的引用
  const svgRef = useRef(null);

  // 使用useEffect添加被动事件监听器
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !onZoom) return;

    // 滚轮事件处理函数
    const handleWheel = (event) => {
      onZoom(event);
    };

    // 使用被动事件监听器添加滚轮事件
    svgElement.addEventListener('wheel', handleWheel, { passive: false });

    // 清理函数
    return () => {
      svgElement.removeEventListener('wheel', handleWheel);
    };
  }, [onZoom]);

  const handleNodeClick = (e, id) => {
    e.stopPropagation();
    onRectClick(e, id);
  };

  const handleNodeDoubleClick = (e, id) => {
    e.stopPropagation();
    onRectDoubleClick(e, id);
  };

  const handleNodeHeightChange = (id, height) => {
    if (onNodeHeightChange) {
      onNodeHeightChange(id, height);
    }
  };

  const handleNodeWidthChange = (id, width) => {
    if (onNodeWidthChange) {
      onNodeWidthChange(id, width);
    }
  };

  const visibleNodes = useMemo(() => {
    return nodes.filter(node => isNodeVisible(node, viewport, transform.scale));
  }, [nodes, viewport, transform.scale]);

  const visibleLinks = useMemo(() => {
    return links.filter(link => {
      const sourceVisible = isNodeVisible(link.source, viewport, transform.scale);
      const targetVisible = isNodeVisible(link.target, viewport, transform.scale);
      return sourceVisible || targetVisible;
    });
  }, [links, viewport, transform.scale]);

  return (
    <div className="split-layout">
      <div className="mindmap-container">
        <svg 
          ref={svgRef}
          className={`canvas ${isDragging ? 'dragging' : ''}`}
          onMouseDown={onDragStart}
          onClick={onCanvasClick}
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>
            </marker>
            <marker
              id="arrowhead-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2196f3"/>
            </marker>
            <marker
              id="arrowhead-question"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff"/>
            </marker>
            <marker
              id="arrowhead-answer"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#52c41a"/>
            </marker>
          </defs>
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {visibleLinks.map(link => (
              <Connection
                key={`${link.source.id}-${link.target.id}`}
                startNode={link.source}
                endNode={link.target}
                basePosition={{ x: 0, y: 0 }}
              />
            ))}
            {visibleNodes.map(node => (
              <Node
                key={node.id}
                node={node}
                isSelected={node.id === selectedRect}
                isEditing={node.id === editingRect}
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                onTextChange={onTextChange}
                onTextBlur={onTextBlur}
                onHeightChange={handleNodeHeightChange}
                onWidthChange={handleNodeWidthChange}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className="hint-text">
        Press Tab and feel free to ask
      </div>
      <div className="zoom-indicator">
        缩放: {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
};

export default VirtualCanvas; 