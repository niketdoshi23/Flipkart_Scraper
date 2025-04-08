import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ThemeWrapper } from './ThemeWrapper';

ReactDOM.render(
  <React.StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </React.StrictMode>,
  document.getElementById('root')
);