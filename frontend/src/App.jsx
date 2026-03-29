import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import MainTracking from './components/MainTracking';

export default function App() {
  const [screen, setScreen] = useState('setup');

  const handleDaySetup = () => {
    setScreen('tracking');
  };

  const handleExit = () => {
    setScreen('setup');
  };

  return screen === 'setup' ? (
    <SetupScreen onDaySetup={handleDaySetup} />
  ) : (
    <MainTracking onExit={handleExit} />
  );
}
