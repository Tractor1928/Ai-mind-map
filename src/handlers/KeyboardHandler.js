
// src/handlers/KeyboardHandler.js
const KeyboardHandler = (event, addNode, generateAnswer) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      addNode();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      generateAnswer();
    }
  };
  
  export default KeyboardHandler;