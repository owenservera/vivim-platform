import React from 'react';
import ReactDOM from 'react-dom/client';
import RealIconViewer from './RealIconViewer';
import './App.css';

const App = () => {
  return (
    <div>
      <RealIconViewer />
    </div>
  );
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
} else {
  // Fallback for environments without DOM
  console.log('DOM not available, rendering skipped');
}

export default App;