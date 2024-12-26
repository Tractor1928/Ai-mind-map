// src/hooks/useNodeOperations.js
import { useState, useEffect, useCallback } from 'react';
import { RectNode, NODE_TYPES } from '../models/RectNode';
import { calculateTreeLayout } from '../utils/d3TreeLayout';

export const useNodeOperations = () => {
  const [rectangles, setRectangles] = useState([]);
  const [selectedRect, setSelectedRect] = useState(null);
  const [editingRect, setEditingRect] = useState(null);
  const [shouldUpdateLayout, setShouldUpdateLayout] = useState(false);

  // 仅在节点添加或删除时更新布局
  useEffect(() => {
    if (shouldUpdateLayout && rectangles.length > 0) {
      const updatedRects = calculateTreeLayout([...rectangles]);
      setRectangles(updatedRects);
      setShouldUpdateLayout(false);
    }
  }, [shouldUpdateLayout, rectangles]);

  const addNode = useCallback((currentRect) => {
    // 如果没有当前选中的节点，说明是第一层
    const newLevel = currentRect ? currentRect.level + 1 : 0;
    // 根据层级决定类型：偶数层级为问题，奇数层级为答案
    const nodeType = newLevel % 2 === 0 ? 
      NODE_TYPES.QUESTION : 
      NODE_TYPES.ANSWER;

    const newNode = new RectNode(
      Date.now(),
      0,
      0,
      '',
      nodeType
    );

    if (currentRect) {
      newNode.setParent(currentRect.id);
      newNode.setLevel(newLevel);  // 设置新节点的层级
      const updatedRects = rectangles.map(rect => {
        if (rect.id === currentRect.id) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            rect.text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = [...rect.childrenIds];
          updatedRect.level = rect.level;
          updatedRect.addChild(newNode.id);
          return updatedRect;
        }
        return rect;
      });
      setRectangles([...updatedRects, newNode]);
    } else {
      setRectangles([...rectangles, newNode]);
    }

    setSelectedRect(newNode.id);
    setEditingRect(newNode.id);
    setShouldUpdateLayout(true);
  }, [rectangles]);

  const updateNodeText = useCallback((id, text) => {
    setRectangles(prev => {
      const updatedRects = prev.map(rect => {
        if (rect.id === id) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = [...rect.childrenIds];
          updatedRect.level = rect.level;
          updatedRect.updateText(text);
          return updatedRect;
        }
        return rect;
      });
      
      // 触发布局更新
      setShouldUpdateLayout(true);
      return updatedRects;
    });
  }, []);

  return {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText
  };
};