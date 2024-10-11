
// src/handlers/DragDropHandler.js
import { useDrag, useDrop } from 'react-dnd';

const DragDropHandler = (item, onDrop) => {
  const [, ref] = useDrag(() => ({
    type: 'NODE',
    item,
  }));

  const [, drop] = useDrop(() => ({
    accept: 'NODE',
    drop: (draggedItem) => onDrop(draggedItem, item),
  }));

  return [ref, drop];
};

export default DragDropHandler;