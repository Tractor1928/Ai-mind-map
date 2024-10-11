
// src/handlers/CanvasHandler.js
import { useRef, useEffect } from 'react';

const CanvasHandler = () => {
  const canvasRef = useRef(null);
  const startPosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (event) => {
      isDragging.current = true;
      startPosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event) => {
      if (!isDragging.current) return;

      const dx = event.clientX - startPosition.current.x;
      const dy = event.clientY - startPosition.current.y;

      canvas.scrollLeft -= dx;
      canvas.scrollTop -= dy;

      startPosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return canvasRef;
};

export default CanvasHandler;