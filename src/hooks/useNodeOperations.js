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
    const nodeType = rectangles.length % 2 === 0 ? 
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
      newNode.setLevel(currentRect.level + 1);
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
    setRectangles(prev => prev.map(rect => {
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
        return updatedRect;
      }
      return rect;
    }));
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