import React from 'react';
import MentalHealthAnalyzer from './components/MentalHealthAnalyzer';
import './App.css';

const App = () => {
  return (
    <div className="container">
      <header className="header">
        <h1>Mental Health Analysis Tool</h1>
        <p>Analyze text for mental health insights and patterns</p>
      </header>

      <main>
        <MentalHealthAnalyzer />
      </main>

      <footer className="footer">
        <p>Please note: This tool is for educational purposes only and should not be used as a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default App;