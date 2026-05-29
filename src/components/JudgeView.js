// src/components/JudgeView.js
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { ref, set, onValue } from 'firebase/database';
import { PHASES, isPhaseComplete, scorePhase } from '../phases';

export default function JudgeView({ judgeNumber, judgeName, sessionData, onLogout }) {
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [timestamps, setTimestamps] = useState({});

  const judgeKey = `judge${judgeNumber}`;
  const currentPhaseIndex = sessionData?.currentPhase ?? 0; // 0-based index
  const topic = sessionData?.topic || '';
  const teamPro = sessionData?.teamPro || 'Pro';
  const teamCons = sessionData?.teamCons || 'Cons';
  const numJudges = sessionData?.numJudges || 3;

  // Load existing answers from Firebase
  useEffect(() => {
    const answersRef = ref(db, `session/answers/${judgeKey}`);
    const unsub = onValue(answersRef, (snap) => {
      setAnswers(snap.val() || {});
    });
    return () => unsub();
  }, [judgeKey]);

  // Load timestamps
  useEffect(() => {
    const tsRef = ref(db, `session/timestamps/${judgeKey}`);
    const unsub = onValue(tsRef, (snap) => {
      setTimestamps(snap.val() || {});
    });
    return () => unsub();
  }, [judgeKey]);

  const saveAnswer = useCallback(async (phaseId, questionId, value) => {
    setSaving(true);
    const newAnswers = {
      ...answers,
      [phaseId]: {
        ...(answers[phaseId] || {}),
        [questionId]: value,
      },
    };
    setAnswers(newAnswers);

    try {
      await set(ref(db, `session/answers/${judgeKey}/${phaseId}/${questionId}`), value);

      // Check if phase just became complete
      const phase = PHASES.find(p => p.id === phaseId);
      if (phase && isPhaseComplete(phase, newAnswers[phaseId])) {
        if (!timestamps[phaseId]) {
          await set(ref(db, `session/timestamps/${judgeKey}/${phaseId}`), Date.now());
        }
      }
    } catch (e) {
      console.error('Save error', e);
    }
    setSaving(false);
  }, [answers, judgeKey, timestamps]);

  // Determine which phases are available (up to and including currentPhaseIndex)
  // Judges must complete phases in order
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setActiveTab(currentPhaseIndex);
  }, [currentPhaseIndex]);

  // All phases completed check
  const allPhasesComplete = PHASES.every(phase =>
    isPhaseComplete(phase, answers[phase.id])
  );

  const phase = PHASES[activeTab];
  const phaseAnswers = answers[phase?.id] || {};
  const phaseComplete = phase ? isPhaseComplete(phase, phaseAnswers) : false;
  const phaseResult = phase ? scorePhase(phase, phaseAnswers) : null;

  // Can judge access this tab?
  function canAccessTab(tabIndex) {
    if (tabIndex > currentPhaseIndex) return false; // coordinator hasn't opened it
    if (tabIndex === 0) return true;
    // All previous phases must be complete
    for (let i = 0; i < tabIndex; i++) {
      if (!isPhaseComplete(PHASES[i], answers[PHASES[i].id])) return false;
    }
    return true;
  }

  const phaseOrators = sessionData?.phaseOrators || {};
  const currentOrators = phaseOrators[phase?.id] || {};

  return (
    <div className="judge-page">
      <header className="site-header">
        <div className="header-brand">
          <span className="brand-icon">⚖</span>
          <span className="brand-name">Botta e Risposta</span>
          <span className="brand-sub">World Cup 2026</span>
        </div>
        {topic && <div className="header-topic">"{topic}"</div>}
        <div className="header-right">
          <span className="header-judge-name">{judgeName} · Judge {judgeNumber}</span>
          {saving && <span className="saving-dot" title="Saving…" />}
        </div>
      </header>

      {/* Phase tabs */}
      <div className="phase-tabs">
        {PHASES.map((p, i) => {
          const accessible = canAccessTab(i);
          const complete = isPhaseComplete(p, answers[p.id]);
          const isActive = activeTab === i;
          return (
            <button
              key={p.id}
              className={`phase-tab ${isActive ? 'active' : ''} ${complete ? 'done' : ''} ${!accessible ? 'locked' : ''}`}
              onClick={() => accessible && setActiveTab(i)}
              disabled={!accessible}
              title={!accessible && i > currentPhaseIndex ? 'Phase not yet opened by Coordinator' : ''}
            >
              <span className="tab-num">{i + 1}</span>
              <span className="tab-name">{p.name}</span>
              {complete && <span className="tab-check">✓</span>}
              {!accessible && <span className="tab-lock">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Teams banner */}
      <div className="teams-banner">
        <div className="tb-team pro-side">
          <span className="tb-badge" style={{ background: 'var(--pro-color)' }}>PRO</span>
          <span className="tb-name">{teamPro}</span>
        </div>
        <div className="tb-sep">vs</div>
        <div className="tb-team cons-side">
          <span className="tb-name">{teamCons}</span>
          <span className="tb-badge" style={{ background: 'var(--cons-color)' }}>CONS</span>
        </div>
      </div>

      {/* Phase content */}
      <main className="judge-main">
        <div className="phase-header">
          <h2 className="phase-title">Phase {activeTab + 1}: {phase.name}</h2>
          {(currentOrators.nameA || currentOrators.nameB) && (
            <div className="phase-orators">
              <span className="orator-label" style={{ color: 'var(--pro-color)' }}>
                {currentOrators.nameA || '—'}
              </span>
              <span className="orator-vs"> vs </span>
              <span className="orator-label" style={{ color: 'var(--cons-color)' }}>
                {currentOrators.nameB || '—'}
              </span>
            </div>
          )}
        </div>

        <PhaseQuestions
          phase={phase}
          answers={phaseAnswers}
          onAnswer={saveAnswer}
          teamPro={teamPro}
          teamCons={teamCons}
        />

        {phaseComplete && phaseResult?.result && (
          <div className={`phase-verdict judge-verdict verdict-${phaseResult.result}`}>
            <span className="verdict-label">Your verdict for this phase:</span>
            <span className="verdict-value">
              {phaseResult.result === 'pro' ? teamPro : phaseResult.result === 'cons' ? teamCons : 'Tie'}
            </span>
          </div>
        )}
      </main>

      {allPhasesComplete && (
        <div className="thank-you-bar">
          <div className="ty-content">
            <span className="ty-icon">🙏</span>
            <span className="ty-text">Thank you, {judgeName}! All phases submitted.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phase Questions Component ────────────────────────────────────────────────
function PhaseQuestions({ phase, answers, onAnswer, teamPro, teamCons }) {
  // Render macro group + standalone questions
  const renderedMacroGroups = new Set();

  return (
    <div className="questions-list">
      {phase.questions.map((q, qi) => {
        if (q.macroGroup && !renderedMacroGroups.has(q.macroGroup)) {
          renderedMacroGroups.add(q.macroGroup);
          const mg = phase.macroGroups.find(m => m.id === q.macroGroup);
          const groupQuestions = phase.questions.filter(qq => qq.macroGroup === q.macroGroup);
          return (
            <MacroGroupBlock
              key={q.macroGroup}
              macroGroup={mg}
              questions={groupQuestions}
              answers={answers}
              onAnswer={(qId, val) => onAnswer(phase.id, qId, val)}
              teamPro={teamPro}
              teamCons={teamCons}
            />
          );
        }
        if (q.macroGroup) return null; // already rendered
        return (
          <ComparativeQuestion
            key={q.id}
            question={q}
            index={qi}
            answer={answers[q.id]}
            onAnswer={(val) => onAnswer(phase.id, q.id, val)}
            teamPro={teamPro}
            teamCons={teamCons}
          />
        );
      })}
    </div>
  );
}

// ─── Comparative Question (Pro / Tie / Cons) ─────────────────────────────────
function ComparativeQuestion({ question, answer, onAnswer, teamPro, teamCons, index }) {
  return (
    <div className={`question-card ${answer ? 'answered' : ''}`}>
      <div className="question-text-row">
        <span className="question-weight">{Math.round((question.weight || 0) * 100 / 1)}%</span>
        <p className="question-text">{question.text}</p>
      </div>
      <div className="answer-buttons comparative">
        <button
          className={`ans-btn pro-btn ${answer === 'pro' ? 'selected' : ''}`}
          onClick={() => onAnswer('pro')}
        >
          {teamPro}
        </button>
        <button
          className={`ans-btn tie-btn ${answer === 'tie' ? 'selected' : ''}`}
          onClick={() => onAnswer('tie')}
        >
          Tie
        </button>
        <button
          className={`ans-btn cons-btn ${answer === 'cons' ? 'selected' : ''}`}
          onClick={() => onAnswer('cons')}
        >
          {teamCons}
        </button>
      </div>
    </div>
  );
}

// ─── Macro Group Block ────────────────────────────────────────────────────────
function MacroGroupBlock({ macroGroup, questions, answers, onAnswer, teamPro, teamCons }) {
  // Compute resolved macro result for preview
  function previewResult() {
    const vals = questions.map(q => answers[q.id]);
    if (vals.some(v => !v)) return null;
    const logic = macroGroup.logicType;

    if (logic === 'phase2_pro') {
      const [a1, a2, a3] = vals;
      if (a1 === a2 && a2 === a3) return 'tie';
      if ((a1 === 'yes' || a2 === 'yes') && a3 === 'no') return 'pro';
      if ((a1 === 'no' || a2 === 'no') && a3 === 'yes') return 'cons';
      return 'tie';
    }
    if (logic === 'phase3_cons') {
      const [a1, a2, a3] = vals;
      if (a1 === a2 && a2 === a3) return 'tie';
      if ((a1 === 'yes' || a2 === 'yes') && a3 === 'no') return 'cons';
      if ((a1 === 'no' || a2 === 'no') && a3 === 'yes') return 'pro';
      return 'tie';
    }
    if (logic === 'phase4_pro') {
      const [a1, a2] = vals;
      if (a1 === a2) return 'tie';
      if (a1 === 'yes' && a2 === 'no') return 'pro';
      return 'cons';
    }
    if (logic === 'phase5_cons') {
      const [a1, a2] = vals;
      if (a1 === a2) return 'tie';
      if (a1 === 'yes' && a2 === 'no') return 'cons';
      return 'pro';
    }
    return null;
  }

  const result = previewResult();
  const allAnswered = questions.every(q => answers[q.id]);

  return (
    <div className="macro-group-card">
      <div className="macro-header">
        <span className="macro-label">Grouped Criteria</span>
        <span className="macro-weight">{Math.round((macroGroup.weight || 0) * 100)}% combined</span>
      </div>

      <div className="macro-questions">
        {questions.map((q) => (
          <div key={q.id} className={`yesno-row ${answers[q.id] ? 'answered' : ''}`}>
            <p className="yesno-text">{q.text}</p>
            <div className="yesno-buttons">
              <button
                className={`yn-btn yes-btn ${answers[q.id] === 'yes' ? 'selected' : ''}`}
                onClick={() => onAnswer(q.id, 'yes')}
              >Yes</button>
              <button
                className={`yn-btn no-btn ${answers[q.id] === 'no' ? 'selected' : ''}`}
                onClick={() => onAnswer(q.id, 'no')}
              >No</button>
            </div>
          </div>
        ))}
      </div>

      {allAnswered && result && (
        <div className={`macro-result result-${result}`}>
          <span>Combined result: </span>
          <strong>{result === 'pro' ? teamPro : result === 'cons' ? teamCons : 'Tie'}</strong>
        </div>
      )}
    </div>
  );
}
