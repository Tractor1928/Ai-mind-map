// src/components/Node.js
import React, { useState } from 'react';

const Node = ({ text, onAddNode, onGenerateAnswer, onSelectNode, isSelected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeText, setNodeText] = useState(text);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleClick = () => {
    onSelectNode();
  };

  const handleChange = (event) => {
    setNodeText(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setIsEditing(false);
      onGenerateAnswer(nodeText);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      onAddNode();
      setIsEditing(true);
    }
  };

  return (
    <div
      style={{
        border: isSelected ? '2px solid blue' : '1px solid black',
        padding: '10px',
        margin: '10px',
        borderRadius: '8px',
        display: 'inline-block',
        width: '200px',
        cursor: 'pointer',
        verticalAlign: 'top',
      }}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      tabIndex="0"
      onKeyDown={handleKeyDown}
    >
      {isEditing ? (
        <input
          type="text"
          value={nodeText}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        nodeText
      )}
    </div>
  );
};

export default Node;