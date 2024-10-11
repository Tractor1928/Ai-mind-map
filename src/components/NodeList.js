
// src/components/NodeList.js
import React from 'react';
import Node from './Node';

const NodeList = ({ nodes, onAddNode, onGenerateAnswer, onSelectNode, selectedNodeId }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {nodes.map((node) => (
        <div key={node.id} style={{ marginLeft: '20px', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Node
            text={node.text}
            onAddNode={() => onAddNode(node.id)}
            onGenerateAnswer={(text) => onGenerateAnswer(node.id, text)}
            onSelectNode={() => onSelectNode(node.id)}
            isSelected={selectedNodeId === node.id}
          />
          {node.children.length > 0 && (
            <NodeList
              nodes={node.children}
              onAddNode={onAddNode}
              onGenerateAnswer={onGenerateAnswer}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default NodeList;