// src/components/LoginScreen.js
import React, { useState } from 'react';

export default function LoginScreen({ onLogin, sessionData }) {
  const [mode, setMode] = useState(null); // 'coordinator' | 'judge'
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [judgeNum, setJudgeNum] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const numJudges = sessionData?.numJudges || 3;
  const judges = sessionData?.judges || {};
  const teamPro = sessionData?.teamPro || 'Pro';
  const teamCons = sessionData?.teamCons || 'Cons';
  const topic = sessionData?.topic || '';

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    let result;
    if (mode === 'coordinator') {
      result = await onLogin({ type: 'coordinator', pin, name });
    } else {
      if (!judgeNum) { setError('Select your judge number'); setLoading(false); return; }
      result = await onLogin({ type: 'judge', judgeNum: parseInt(judgeNum), name });
    }
    if (result?.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      
      <header className="site-header">
        <div className="header-brand">
          <span className="brand-icon">⚖</span>
          <span className="brand-name">Botta e Risposta</span>
          <span className="brand-sub">World Cup 2026</span>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="login-card-top">
            <h1 className="login-title">Debate Scorecard</h1>
            {topic && <p className="login-topic">"{topic}"</p>}
            {!topic && <p className="login-topic-placeholder">The debate topic will appear here</p>}
          </div>

          {!mode && (
            <div className="login-choices">
              <p className="login-prompt">Who are you?</p>
              <button className="btn-choice coordinator" onClick={() => setMode('coordinator')}>
                <span className="choice-icon">🎯</span>
                <span className="choice-label">Coordinator</span>
              </button>
              <button className="btn-choice judge" onClick={() => setMode('judge')}>
                <span className="choice-icon">⚖️</span>
                <span className="choice-label">Judge</span>
              </button>
            </div>
          )}

          {mode && (
            <div className="login-form">
              <button className="btn-back" onClick={() => { setMode(null); setError(''); setPin(''); setName(''); setJudgeNum(''); }}>
                ← Back
              </button>

              <div className="form-group">
                <label>Your name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your name…"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                />
              </div>

              {mode === 'coordinator' && (
                <div className="form-group">
                  <label>Coordinator PIN</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Enter PIN…"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              )}

              {mode === 'judge' && (
                <div className="form-group">
                  <label>Select your judge slot</label>
                  <div className="judge-slots">
                    {Array.from({ length: numJudges }, (_, i) => i + 1).map(n => {
                      const taken = judges[`judge${n}`]?.taken;
                      const takenName = judges[`judge${n}`]?.name;
                      return (
                        <button
                          key={n}
                          className={`judge-slot ${taken ? 'taken' : ''} ${judgeNum === String(n) ? 'selected' : ''}`}
                          onClick={() => !taken && setJudgeNum(String(n))}
                          disabled={taken}
                          title={taken ? `Taken by ${takenName}` : `Judge ${n}`}
                        >
                          <span className="slot-num">{n}</span>
                          {taken ? <span className="slot-status taken-label">{takenName}</span> : <span className="slot-status free-label">Available</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}

              <button
                className="btn-enter"
                onClick={handleSubmit}
                disabled={loading || !name.trim() || (mode === 'coordinator' && !pin)}
              >
                {loading ? 'Entering…' : 'Enter'}
              </button>
            </div>
          )}
        </div>

        <div className="login-deco">
          <div className="deco-team pro-deco">
            <span className="deco-label">{teamPro}</span>
            <div className="deco-bar pro-bar" />
          </div>
          <div className="deco-vs">VS</div>
          <div className="deco-team cons-deco">
            <div className="deco-bar cons-bar" />
            <span className="deco-label">{teamCons}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
