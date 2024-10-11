
// src/handlers/AIHandler.js
import axios from 'axios';

const AIHandler = async (text) => {
  try {
    const response = await axios.post('/api/generate', { text });
    return response.data.answer;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'AI response failed';
  }
};

export default AIHandler;