// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { NodeProvider } from './context/NodeContext';

ReactDOM.render(
  <React.StrictMode>
    <NodeProvider>
      <App />
    </NodeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);