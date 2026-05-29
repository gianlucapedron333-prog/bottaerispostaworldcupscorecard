// src/components/WaitingScreen.js
import React from 'react';

export default function WaitingScreen({ judgeName, sessionData }) {
  const topic = sessionData?.topic || '';
  const teamPro = sessionData?.teamPro || 'Pro';
  const teamCons = sessionData?.teamCons || 'Cons';

  return (
    <div className="waiting-page">
      <div className="waiting-bg" />
      <header className="site-header">
        <div className="header-brand">
          <span className="brand-icon">⚖</span>
          <span className="brand-name">Botta e Risposta</span>
          <span className="brand-sub">World Cup 2026</span>
        </div>
        {topic && <div className="header-topic">"{topic}"</div>}
      </header>

      <main className="waiting-main">
        <div className="waiting-card">
          <div className="waiting-pulse">
            <div className="pulse-ring" />
            <div className="pulse-ring delay1" />
            <div className="pulse-ring delay2" />
            <span className="pulse-icon">⏳</span>
          </div>
          <h2 className="waiting-title">Welcome, {judgeName}</h2>
          <p className="waiting-subtitle">The Coordinator hasn't opened the first phase yet.</p>
          <p className="waiting-hint">This page will update automatically when the debate begins.</p>

          <div className="waiting-teams">
            <div className="wt-team pro-team">
              <span className="wt-badge">PRO</span>
              <span className="wt-name">{teamPro}</span>
            </div>
            <div className="wt-vs">⚔</div>
            <div className="wt-team cons-team">
              <span className="wt-badge">CONS</span>
              <span className="wt-name">{teamCons}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
