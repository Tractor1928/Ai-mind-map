// src/hooks/useNodeOperations.js
import { useState } from 'react';
import { RectNode, NODE_TYPES } from '../models/RectNode';

export const useNodeOperations = () => {
  const [rectangles, setRectangles] = useState([]);
  const [selectedRect, setSelectedRect] = useState(null);
  const [editingRect, setEditingRect] = useState(null);

  const addNode = (currentRect) => {
    const nodeType = rectangles.length % 2 === 0 ? 
      NODE_TYPES.QUESTION : 
      NODE_TYPES.ANSWER;

    let newX, newY, newLevel;
    if (currentRect) {
      newLevel = currentRect.level + 1;
      newX = 50 + (newLevel * 250);
      
      const childNodes = rectangles.filter(r => r.parentId === currentRect.id);
      
      if (childNodes.length === 0) {
        newY = currentRect.y;
      } else {
        const totalHeight = (childNodes.length + 1) * 80;
        const startY = currentRect.y - (totalHeight / 2) + 40;
        
        const updatedRects = [...rectangles];
        childNodes.forEach((child, index) => {
          const rect = updatedRects.find(r => r.id === child.id);
          if (rect) {
            rect.y = startY + (index * 80);
          }
        });
        setRectangles(updatedRects);
        
        newY = startY + (childNodes.length * 80);
      }
    } else {
      newLevel = 0;
      newX = 50;
      newY = 50;
    }

    const newNode = new RectNode(
      Date.now(),
      newX,
      newY,
      '',
      nodeType
    );

    newNode.setLevel(newLevel);
    
    if (currentRect) {
      newNode.setParent(currentRect.id);
      const updatedRects = rectangles.map(rect => {
        if (rect.id === currentRect.id) {
          rect.addChild(newNode.id);
        }
        return rect;
      });
      setRectangles([...updatedRects, newNode]);
    } else {
      setRectangles([...rectangles, newNode]);
    }

    setSelectedRect(newNode.id);
    setEditingRect(newNode.id);
  };

  const updateNodeText = (id, text) => {
    setRectangles(prev => prev.map(rect =>
      rect.id === id ? { ...rect, text } : rect
    ));
  };

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