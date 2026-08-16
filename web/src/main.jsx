import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { OperatorProvider } from './production/OperatorContext';
import './styles/index.css';
import './styles/production.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OperatorProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </OperatorProvider>
  </React.StrictMode>,
);
