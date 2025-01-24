// src/hooks/useNodeOperations.js
import { useState, useEffect, useCallback } from 'react';
import { RectNode, NODE_TYPES } from '../models/RectNode';
import { calculateTreeLayout } from '../../layout/utils/treeLayout';

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

  const addNode = useCallback((currentRect, initialText = '', type = null) => {
    // 如果没有当前选中的节点，说明是第一层
    const newLevel = currentRect ? currentRect.level + 1 : 0;
    
    // 如果没有指定类型，则根据层级决定类型
    const nodeType = type || (newLevel % 2 === 0 ? 
      NODE_TYPES.QUESTION : 
      NODE_TYPES.ANSWER);

    const newNode = new RectNode(
      Date.now(),
      0,
      0,
      initialText,
      nodeType
    );

    if (currentRect) {
      newNode.setParent(currentRect.id);
      newNode.setLevel(newLevel);
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
    
    return newNode;
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

  const deleteNode = useCallback((id) => {
    setRectangles(prev => {
      // 找到要删除的节点及其所有子节点
      const nodeToDelete = prev.find(r => r.id === id);
      if (!nodeToDelete) return prev;
      
      // 获取所有需要删除的节点ID(包括子节点)
      const idsToDelete = new Set([id]);
      const getChildrenIds = (nodeId) => {
        const node = prev.find(r => r.id === nodeId);
        if (node && node.childrenIds.length > 0) {
          node.childrenIds.forEach(childId => {
            idsToDelete.add(childId);
            getChildrenIds(childId);
          });
        }
      };
      getChildrenIds(id);
      
      // 更新父节点的 childrenIds
      const updatedRects = prev.map(rect => {
        if (rect.id === nodeToDelete.parentId) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            rect.text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = rect.childrenIds.filter(cid => cid !== id);
          updatedRect.level = rect.level;
          return updatedRect;
        }
        return rect;
      });
      
      // 过滤掉要删除的节点
      const filteredRects = updatedRects.filter(r => !idsToDelete.has(r.id));
      
      setShouldUpdateLayout(true);
      return filteredRects;
    });
    
    setSelectedRect(null);
    setEditingRect(null);
  }, []);

  return {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText,
    deleteNode
  };
};