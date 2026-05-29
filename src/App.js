// src/App.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { ref, onValue, set, get } from 'firebase/database';
import LoginScreen from './components/LoginScreen';
import CoordinatorView from './components/CoordinatorView';
import JudgeView from './components/JudgeView';
import WaitingScreen from './components/WaitingScreen';
import './App.css';

const COORDINATOR_PIN = '2026'; // ← change this if you want

function App() {
  const [role, setRole] = useState(null); // null | 'coordinator' | 'judge'
  const [judgeNumber, setJudgeNumber] = useState(null);
  const [judgeName, setJudgeName] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live sync of session data
  useEffect(() => {
    const sessionRef = ref(db, 'session');
    const unsub = onValue(sessionRef, (snap) => {
      setSessionData(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bnr_role');
    const savedJudge = localStorage.getItem('bnr_judge');
    const savedName = localStorage.getItem('bnr_name');
    if (saved === 'coordinator') {
      setRole('coordinator');
    } else if (saved === 'judge' && savedJudge) {
      setRole('judge');
      setJudgeNumber(parseInt(savedJudge));
      setJudgeName(savedName || '');
    }
  }, []);

  const handleLogin = async ({ type, pin, judgeNum, name }) => {
    if (type === 'coordinator') {
      if (pin !== COORDINATOR_PIN) return { error: 'Wrong PIN' };
      localStorage.setItem('bnr_role', 'coordinator');
      localStorage.setItem('bnr_name', name);
      setRole('coordinator');
      setJudgeName(name);
      // Register coordinator name in Firebase
      await set(ref(db, 'session/coordinatorName'), name);
      return { ok: true };
    }

    if (type === 'judge') {
      // Check if slot is taken
      const slotRef = ref(db, `session/judges/judge${judgeNum}/taken`);
      const snap = await get(slotRef);
      if (snap.val() === true) return { error: 'This judge slot is already taken' };

      // Claim the slot
      await set(ref(db, `session/judges/judge${judgeNum}`), { taken: true, name, joinedAt: Date.now() });
      localStorage.setItem('bnr_role', 'judge');
      localStorage.setItem('bnr_judge', judgeNum);
      localStorage.setItem('bnr_name', name);
      setRole('judge');
      setJudgeNumber(judgeNum);
      setJudgeName(name);
      return { ok: true };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bnr_role');
    localStorage.removeItem('bnr_judge');
    localStorage.removeItem('bnr_name');
    setRole(null);
    setJudgeNumber(null);
    setJudgeName('');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Connecting…</p>
      </div>
    );
  }

  if (!role) {
    return <LoginScreen onLogin={handleLogin} sessionData={sessionData} />;
  }

  if (role === 'coordinator') {
    return (
      <CoordinatorView
        sessionData={sessionData}
        judgeName={judgeName}
        onLogout={handleLogout}
      />
    );
  }

  if (role === 'judge') {
    // Check if debate has started (coordinator opened first phase)
    const currentPhase = sessionData?.currentPhase;
    if (!currentPhase) {
      return <WaitingScreen judgeName={judgeName} sessionData={sessionData} />;
    }
    return (
      <JudgeView
        judgeNumber={judgeNumber}
        judgeName={judgeName}
        sessionData={sessionData}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

export default App;
