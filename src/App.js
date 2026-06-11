// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from './firebase/config';
import { ref, onValue, set, get, remove } from 'firebase/database';
import LoginScreen from './components/LoginScreen';
import CoordinatorView from './components/CoordinatorView';
import JudgeView from './components/JudgeView';
import WaitingScreen from './components/WaitingScreen';
import './App.css';

export const COORDINATOR_PIN = '2026';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function App() {
  const [role, setRole] = useState(null);
  const [judgeNumber, setJudgeNumber] = useState(null);
  const [judgeName, setJudgeName] = useState('');
  const [isAlsoModerator, setIsAlsoModerator] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  // Live sync of session data
  useEffect(() => {
    const sessionRef = ref(db, 'session');
    const unsub = onValue(sessionRef, (snap) => {
      const data = snap.val() || {};
      setSessionData(data);
      setLoading(false);

      // Detect reset: if judges node was cleared while we're logged in as judge
      const saved = localStorage.getItem('bnr_role');
      const savedJudge = localStorage.getItem('bnr_judge');
      if (saved === 'judge' && savedJudge) {
        const judgeKey = `judge${savedJudge}`;
        if (!data?.judges?.[judgeKey]?.taken) {
          // Our slot was cleared (reset happened) — log out
          handleLogout();
        }
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bnr_role');
    const savedJudge = localStorage.getItem('bnr_judge');
    const savedName = localStorage.getItem('bnr_name');
    const savedMod = localStorage.getItem('bnr_also_moderator');
    if (saved === 'coordinator') {
      setRole('coordinator');
      setJudgeName(savedName || '');
    } else if (saved === 'judge' && savedJudge) {
      setRole('judge');
      setJudgeNumber(parseInt(savedJudge));
      setJudgeName(savedName || '');
      setIsAlsoModerator(savedMod === 'true');
    }
  }, []);

  // Inactivity timeout for judges
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      const saved = localStorage.getItem('bnr_role');
      const savedJudge = localStorage.getItem('bnr_judge');
      if (saved === 'judge' && savedJudge) {
        // Release the slot in Firebase
        await remove(ref(db, `session/judges/judge${savedJudge}`));
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (role === 'judge') {
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach(e => window.addEventListener(e, resetInactivityTimer));
      resetInactivityTimer(); // start timer immediately
      return () => {
        events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      };
    }
  }, [role, resetInactivityTimer]);

  const handleLogin = async ({ type, pin, judgeNum, name }) => {
    if (type === 'coordinator') {
      if (pin !== COORDINATOR_PIN) return { error: 'Wrong PIN' };
      localStorage.setItem('bnr_role', 'coordinator');
      localStorage.setItem('bnr_name', name);
      setRole('coordinator');
      setJudgeName(name);
      await set(ref(db, 'session/coordinatorName'), name);
      return { ok: true };
    }

    if (type === 'judge') {
      const slotRef = ref(db, `session/judges/judge${judgeNum}/taken`);
      const snap = await get(slotRef);
      if (snap.val() === true) return { error: 'This judge slot is already taken' };

      await set(ref(db, `session/judges/judge${judgeNum}`), {
        taken: true,
        name,
        joinedAt: Date.now(),
        lastActive: Date.now(),
      });
      localStorage.setItem('bnr_role', 'judge');
      localStorage.setItem('bnr_judge', judgeNum);
      localStorage.setItem('bnr_name', name);
      setRole('judge');
      setJudgeNumber(judgeNum);
      setJudgeName(name);
      return { ok: true };
    }
  };

  const handleActivateModerator = (pin) => {
    if (pin !== COORDINATOR_PIN) return false;
    setIsAlsoModerator(true);
    localStorage.setItem('bnr_also_moderator', 'true');
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem('bnr_role');
    localStorage.removeItem('bnr_judge');
    localStorage.removeItem('bnr_name');
    localStorage.removeItem('bnr_also_moderator');
    setRole(null);
    setJudgeNumber(null);
    setJudgeName('');
    setIsAlsoModerator(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
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
    const currentPhase = sessionData?.currentPhase;
    if ((currentPhase === undefined || currentPhase === null) && !isAlsoModerator) {
      return <WaitingScreen judgeName={judgeName} sessionData={sessionData} />;
    }
    return (
      <JudgeView
        judgeNumber={judgeNumber}
        judgeName={judgeName}
        sessionData={sessionData}
        onLogout={handleLogout}
        isAlsoModerator={isAlsoModerator}
        onActivateModerator={handleActivateModerator}
      />
    );
  }

  return null;
}

export default App;
