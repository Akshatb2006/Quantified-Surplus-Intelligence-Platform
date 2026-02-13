import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css'; // Keep base styles accessible

function App() {
  const [view, setView] = useState('landing');
  const [config, setConfig] = useState(null);

  const handleStart = (newConfig) => {
    setConfig(newConfig);
    setView('dashboard');
  };

  const handleBack = () => {
    setView('landing');
    // We don't clear config so if they go back, they can just start again easily or we can pre-fill.
    // But LandingPage currently doesn't accept initialConfig prop.
    // Let's clear it for "fresh start" feeling as requested.
    setConfig(null);
  };

  return (
    <div className="bg-background min-h-screen font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            className="w-full h-full"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <LandingPage onStart={handleStart} />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="w-full h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <Dashboard initialConfig={config} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
