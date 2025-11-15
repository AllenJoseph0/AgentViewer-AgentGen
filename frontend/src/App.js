import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import AgentManager from './components/AGENTS/agents';
import './App.css';

function App() {
  useEffect(() => {
    // Set default cookies if they don't exist
    if (!Cookies.get('userid')) Cookies.set('userid', '1490');
    if (!Cookies.get('name')) Cookies.set('name', 'Allen Joseph');
    if (!Cookies.get('firmid')) Cookies.set('firmid', '5');
  }, []);

  const userId = parseInt(Cookies.get('userid') || '1490');
  const firmId = parseInt(Cookies.get('firmid') || '5');

  return (
    <div className="App">
      <AgentManager userId={userId} firmId={firmId} />
    </div>
  );
}

export default App;
