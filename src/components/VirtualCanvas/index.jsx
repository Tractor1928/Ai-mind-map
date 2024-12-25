import React, { useMemo } from 'react';
import Node from '../Node';
import Connection from '../Connection';
import { isNodeVisible } from '../../utils/viewport';

const VirtualCanvas = ({
  nodes,
  links,
  viewport,
  scale,
  selectedRect,
  editingRect,
  onNodeClick,
  onNodeDoubleClick,
  onTextChange,
  onTextBlur
}) => {
  const handleNodeClick = (e, id) => {
    e.stopPropagation();
    onNodeClick(e, id);
  };

  const handleNodeDoubleClick = (e, id) => {
    e.stopPropagation();
    onNodeDoubleClick(e, id);
  };

  const visibleNodes = useMemo(() => {
    return nodes.filter(node => isNodeVisible(node, viewport, scale));
  }, [nodes, viewport, scale]);

  const visibleLinks = useMemo(() => {
    return links.filter(link => {
      const sourceVisible = isNodeVisible(link.source, viewport, scale);
      const targetVisible = isNodeVisible(link.target, viewport, scale);
      return sourceVisible || targetVisible;
    });
  }, [links, viewport, scale]);

  return (
    <>
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
          basePosition={{ x: 0, y: 0 }}
          isSelected={selectedRect === node.id}
          isEditing={editingRect === node.id}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onTextChange={onTextChange}
          onTextBlur={onTextBlur}
        />
      ))}
    </>
  );
};

export default VirtualCanvas; 