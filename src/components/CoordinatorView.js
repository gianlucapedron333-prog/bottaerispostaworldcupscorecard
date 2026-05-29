// src/components/CoordinatorView.js
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { ref, set, get, remove, onValue } from 'firebase/database';
import { PHASES, aggregateResults, calculateFinalScore, scorePhase, isPhaseComplete } from '../phases';

export default function CoordinatorView({ sessionData, judgeName, onLogout }) {
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'phases' | 'results'
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [allAnswers, setAllAnswers] = useState({});
  const [timestamps, setTimestamps] = useState({});

  const numJudges = sessionData?.numJudges || 3;
  const teamPro = sessionData?.teamPro || '';
  const teamCons = sessionData?.teamCons || '';
  const topic = sessionData?.topic || '';
  const currentPhase = sessionData?.currentPhase ?? -1; // -1 = not started

  // Live answers from all judges
  useEffect(() => {
    const answersRef = ref(db, 'session/answers');
    const unsub = onValue(answersRef, (snap) => setAllAnswers(snap.val() || {}));
    return () => unsub();
  }, []);

  // Live timestamps
  useEffect(() => {
    const tsRef = ref(db, 'session/timestamps');
    const unsub = onValue(tsRef, (snap) => setTimestamps(snap.val() || {}));
    return () => unsub();
  }, []);

  const save = async (path, value) => {
    setSaving(true);
    await set(ref(db, path), value);
    setSaving(false);
  };

  const openPhase = async (phaseIndex) => {
    await save('session/currentPhase', phaseIndex);
  };

  const handleReset = async () => {
    setSaving(true);
    await remove(ref(db, 'session'));
    localStorage.removeItem('bnr_role');
    localStorage.removeItem('bnr_judge');
    localStorage.removeItem('bnr_name');
    setSaving(false);
    setShowResetConfirm(false);
    window.location.reload();
  };

  // Aggregate results
  const aggregated = aggregateResults(allAnswers, numJudges);
  const finalScore = calculateFinalScore(aggregated);

  return (
    <div className="coordinator-page">
      <header className="site-header">
        <div className="header-brand">
          <span className="brand-icon">⚖</span>
          <span className="brand-name">Botta e Risposta</span>
          <span className="brand-sub">World Cup 2026</span>
        </div>
        {topic && <div className="header-topic">"{topic}"</div>}
        <div className="header-right">
          <span className="header-judge-name">🎯 {judgeName || 'Coordinator'}</span>
          {saving && <span className="saving-dot" title="Saving…" />}
        </div>
      </header>

      {/* Nav tabs */}
      <div className="coord-tabs">
        {['setup', 'phases', 'results'].map(t => (
          <button key={t} className={`coord-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'setup' && '⚙️ Setup'}
            {t === 'phases' && '📋 Phases'}
            {t === 'results' && '🏆 Results'}
          </button>
        ))}
      </div>

      <main className="coord-main">
        {activeTab === 'setup' && (
          <SetupTab
            sessionData={sessionData}
            save={save}
            numJudges={numJudges}
          />
        )}
        {activeTab === 'phases' && (
          <PhasesTab
            sessionData={sessionData}
            allAnswers={allAnswers}
            timestamps={timestamps}
            numJudges={numJudges}
            currentPhase={currentPhase}
            teamPro={teamPro || 'Pro'}
            teamCons={teamCons || 'Cons'}
            aggregated={aggregated}
            onOpenPhase={openPhase}
            save={save}
          />
        )}
        {activeTab === 'results' && (
          <ResultsTab
            aggregated={aggregated}
            finalScore={finalScore}
            teamPro={teamPro || 'Pro'}
            teamCons={teamCons || 'Cons'}
            allAnswers={allAnswers}
            numJudges={numJudges}
            sessionData={sessionData}
            timestamps={timestamps}
            onShowExport={() => setShowExportModal(true)}
          />
        )}
      </main>

      {/* Danger zone */}
      <div className="reset-zone">
        {!showResetConfirm ? (
          <button className="btn-reset-trigger" onClick={() => setShowResetConfirm(true)}>
            🗑 Reset for next debate
          </button>
        ) : (
          <div className="reset-confirm">
            <p>⚠️ This will erase ALL data (votes, names, setup). Are you sure?</p>
            <button className="btn-confirm-reset" onClick={handleReset}>Yes, reset everything</button>
            <button className="btn-cancel-reset" onClick={() => setShowResetConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>

      {showExportModal && (
        <ExportModal
          aggregated={aggregated}
          finalScore={finalScore}
          teamPro={teamPro || 'Pro'}
          teamCons={teamCons || 'Cons'}
          topic={topic}
          allAnswers={allAnswers}
          numJudges={numJudges}
          sessionData={sessionData}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

// ─── Setup Tab ────────────────────────────────────────────────────────────────
function SetupTab({ sessionData, save, numJudges }) {
  const [teamPro, setTeamPro] = useState(sessionData?.teamPro || '');
  const [teamCons, setTeamCons] = useState(sessionData?.teamCons || '');
  const [topic, setTopic] = useState(sessionData?.topic || '');
  const [judges, setJudges] = useState(sessionData?.numJudges || 3);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await Promise.all([
      save('session/teamPro', teamPro),
      save('session/teamCons', teamCons),
      save('session/topic', topic),
      save('session/numJudges', parseInt(judges)),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="setup-tab">
      <h3 className="tab-section-title">Debate Configuration</h3>

      <div className="setup-grid">
        <div className="setup-field">
          <label>Debate Topic</label>
          <textarea
            className="form-input topic-input"
            placeholder="Enter the debate topic or motion…"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={2}
          />
        </div>

        <div className="setup-row">
          <div className="setup-field">
            <label style={{ color: 'var(--pro-color)' }}>Pro Team Name</label>
            <input className="form-input" placeholder="Team Pro" value={teamPro} onChange={e => setTeamPro(e.target.value)} />
          </div>
          <div className="setup-field">
            <label style={{ color: 'var(--cons-color)' }}>Cons Team Name</label>
            <input className="form-input" placeholder="Team Cons" value={teamCons} onChange={e => setTeamCons(e.target.value)} />
          </div>
        </div>

        <div className="setup-field">
          <label>Number of Judges</label>
          <div className="judge-count-buttons">
            {[3, 4, 5].map(n => (
              <button
                key={n}
                className={`jcount-btn ${judges === n ? 'selected' : ''}`}
                onClick={() => setJudges(n)}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>

      <button className={`btn-save-setup ${saved ? 'saved' : ''}`} onClick={handleSave}>
        {saved ? '✓ Saved!' : 'Save Setup'}
      </button>

      <div className="setup-hint">
        <p>💡 Save the setup before moving to Phases. Judges will see the topic and team names on their screens.</p>
      </div>
    </div>
  );
}

// ─── Phases Tab ───────────────────────────────────────────────────────────────
function PhasesTab({ sessionData, allAnswers, timestamps, numJudges, currentPhase, teamPro, teamCons, aggregated, onOpenPhase, save }) {
  return (
    <div className="phases-tab">
      <div className="phases-status-bar">
        <span className="psb-label">Current phase:</span>
        <span className="psb-value">
          {currentPhase === -1 ? 'Not started' : `Phase ${currentPhase + 1}: ${PHASES[currentPhase]?.name}`}
        </span>
      </div>

      {PHASES.map((phase, i) => (
        <PhaseRow
          key={phase.id}
          phase={phase}
          index={i}
          isOpen={i <= currentPhase}
          isCurrent={i === currentPhase}
          allAnswers={allAnswers}
          timestamps={timestamps}
          numJudges={numJudges}
          teamPro={teamPro}
          teamCons={teamCons}
          aggregatedPhase={aggregated[phase.id]}
          onOpen={() => onOpenPhase(i)}
          save={save}
          sessionData={sessionData}
        />
      ))}
    </div>
  );
}

function PhaseRow({ phase, index, isOpen, isCurrent, allAnswers, timestamps, numJudges, teamPro, teamCons, aggregatedPhase, onOpen, save, sessionData }) {
  const [expanded, setExpanded] = useState(false);
  const [orators, setOrators] = useState({
    nameA: sessionData?.phaseOrators?.[phase.id]?.nameA || '',
    nameB: sessionData?.phaseOrators?.[phase.id]?.nameB || '',
  });
  const [editingA, setEditingA] = useState(false);
  const [editingB, setEditingB] = useState(false);
  const [goldA, setGoldA] = useState(sessionData?.phaseOrators?.[phase.id]?.goldA || false);
  const [goldB, setGoldB] = useState(sessionData?.phaseOrators?.[phase.id]?.goldB || false);

  const judgeStatuses = Array.from({ length: numJudges }, (_, i) => {
    const jk = `judge${i + 1}`;
    const jAnswers = allAnswers?.[jk]?.[phase.id];
    const complete = isPhaseComplete(phase, jAnswers);
    const ts = timestamps?.[jk]?.[phase.id];
    const pScore = complete ? scorePhase(phase, jAnswers) : null;
    const judgeName = sessionData?.judges?.[jk]?.name || `Judge ${i + 1}`;
    return { jk, complete, ts, pScore, judgeName };
  });

  const saveOrators = async (updates) => {
    const newVal = { ...orators, ...updates };
    setOrators(newVal);
    await save(`session/phaseOrators/${phase.id}`, { ...newVal, goldA, goldB });
  };

  const toggleGold = async (which) => {
    if (which === 'A') {
      const v = !goldA;
      setGoldA(v);
      await save(`session/phaseOrators/${phase.id}/goldA`, v);
    } else {
      const v = !goldB;
      setGoldB(v);
      await save(`session/phaseOrators/${phase.id}/goldB`, v);
    }
  };

  const phaseResult = aggregatedPhase?.result;

  return (
    <div className={`phase-row ${isOpen ? 'open' : 'locked'} ${isCurrent ? 'current' : ''}`}>
      <div className="phase-row-header" onClick={() => isOpen && setExpanded(!expanded)}>
        <div className="prh-left">
          <span className={`phase-num-badge ${isOpen ? 'open' : 'locked'}`}>{index + 1}</span>
          <div className="prh-names">
            <span className="prh-phase-name">{phase.name}</span>
            <div className="prh-orators">
              {/* Orator A */}
              {editingA ? (
                <input
                  className="orator-input"
                  value={orators.nameA}
                  onChange={e => setOrators(o => ({ ...o, nameA: e.target.value }))}
                  onBlur={() => { saveOrators({ nameA: orators.nameA }); setEditingA(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { saveOrators({ nameA: orators.nameA }); setEditingA(false); } }}
                  placeholder="Orator Pro name…"
                  autoFocus
                  style={{ color: 'var(--pro-color)' }}
                />
              ) : (
                <span
                  className={`orator-chip ${goldA ? 'gold' : 'pro'}`}
                  onClick={(e) => { e.stopPropagation(); setEditingA(true); }}
                  title="Click to edit"
                >
                  {orators.nameA || '+ Pro orator'}
                </span>
              )}
              <span style={{ opacity: 0.4, margin: '0 4px' }}>vs</span>
              {/* Orator B */}
              {editingB ? (
                <input
                  className="orator-input"
                  value={orators.nameB}
                  onChange={e => setOrators(o => ({ ...o, nameB: e.target.value }))}
                  onBlur={() => { saveOrators({ nameB: orators.nameB }); setEditingB(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { saveOrators({ nameB: orators.nameB }); setEditingB(false); } }}
                  placeholder="Orator Cons name…"
                  autoFocus
                  style={{ color: 'var(--cons-color)' }}
                />
              ) : (
                <span
                  className={`orator-chip ${goldB ? 'gold' : 'cons'}`}
                  onClick={(e) => { e.stopPropagation(); setEditingB(true); }}
                  title="Click to edit"
                >
                  {orators.nameB || '+ Cons orator'}
                </span>
              )}
              {/* Gold buttons */}
              {orators.nameA && (
                <button className={`gold-btn ${goldA ? 'active' : ''}`} title="Nominate as Orator of the Day (Pro)" onClick={(e) => { e.stopPropagation(); toggleGold('A'); }}>
                  {goldA ? '⭐' : '☆'}
                </button>
              )}
              {orators.nameB && (
                <button className={`gold-btn ${goldB ? 'active' : ''}`} title="Nominate as Orator of the Day (Cons)" onClick={(e) => { e.stopPropagation(); toggleGold('B'); }}>
                  {goldB ? '⭐' : '☆'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="prh-right">
          {phaseResult && (
            <span className={`phase-mini-result result-${phaseResult}`}>
              {phaseResult === 'pro' ? teamPro : phaseResult === 'cons' ? teamCons : 'Tie'}
            </span>
          )}
          <div className="judge-dots">
            {judgeStatuses.map(j => (
              <span
                key={j.jk}
                className={`judge-dot ${j.complete ? 'done' : 'pending'}`}
                title={`${j.judgeName}: ${j.complete ? 'Complete' + (j.ts ? ' (' + new Date(j.ts).toLocaleTimeString() + ')' : '') : 'Pending'}`}
              />
            ))}
          </div>
          {!isOpen && (
            <button className="btn-open-phase" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              Open Phase
            </button>
          )}
          {isOpen && <span className="expand-arrow">{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

      {expanded && isOpen && (
        <div className="phase-row-detail">
          <JudgeVotesTable
            phase={phase}
            judgeStatuses={judgeStatuses}
            allAnswers={allAnswers}
            numJudges={numJudges}
            teamPro={teamPro}
            teamCons={teamCons}
            aggregatedPhase={aggregatedPhase}
            sessionData={sessionData}
          />
        </div>
      )}
    </div>
  );
}

function JudgeVotesTable({ phase, judgeStatuses, allAnswers, numJudges, teamPro, teamCons, aggregatedPhase, sessionData }) {
  return (
    <div className="judge-votes-table">
      <div className="jvt-header">
        <span>Judge</span>
        <span>Status</span>
        <span>Phase Verdict</span>
        <span>Completed At</span>
      </div>
      {judgeStatuses.map(({ jk, complete, ts, pScore, judgeName }) => (
        <div key={jk} className="jvt-row">
          <span className="jvt-name">{judgeName}</span>
          <span className={`jvt-status ${complete ? 'done' : 'pending'}`}>
            {complete ? '✓ Done' : '⏳ Pending'}
          </span>
          <span className={`jvt-verdict ${pScore?.result ? 'result-' + pScore.result : ''}`}>
            {pScore?.result
              ? pScore.result === 'pro' ? teamPro : pScore.result === 'cons' ? teamCons : 'Tie'
              : '—'}
          </span>
          <span className="jvt-ts">
            {ts ? new Date(ts).toLocaleTimeString() : '—'}
          </span>
        </div>
      ))}

      {aggregatedPhase?.result && (
        <div className={`jvt-aggregate result-${aggregatedPhase.result}`}>
          <span>Aggregate verdict:</span>
          <strong>
            {aggregatedPhase.result === 'pro' ? teamPro : aggregatedPhase.result === 'cons' ? teamCons : 'Tie'}
          </strong>
          <span className="agg-votes">
            ({aggregatedPhase.votes.pro} Pro / {aggregatedPhase.votes.tie} Tie / {aggregatedPhase.votes.cons} Cons)
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────────────────
function ResultsTab({ aggregated, finalScore, teamPro, teamCons, allAnswers, numJudges, sessionData, timestamps, onShowExport }) {
  // Gold orators
  const phaseOrators = sessionData?.phaseOrators || {};
  const goldProNominees = [];
  const goldConsNominees = [];
  for (const phase of PHASES) {
    const po = phaseOrators[phase.id];
    if (po?.goldA && po?.nameA) goldProNominees.push({ name: po.nameA, phase: phase.name });
    if (po?.goldB && po?.nameB) goldConsNominees.push({ name: po.nameB, phase: phase.name });
  }

  return (
    <div className="results-tab">
      <div className="results-scoreboard">
        <div className={`score-card pro-card ${finalScore.winner === 'pro' ? 'winner' : ''}`}>
          <div className="sc-team">{teamPro}</div>
          <div className="sc-points">{finalScore.proPoints}</div>
          <div className="sc-label">points</div>
          {finalScore.winner === 'pro' && <div className="sc-crown">👑</div>}
        </div>
        <div className="score-vs">vs</div>
        <div className={`score-card cons-card ${finalScore.winner === 'cons' ? 'winner' : ''}`}>
          <div className="sc-team">{teamCons}</div>
          <div className="sc-points">{finalScore.consPoints}</div>
          <div className="sc-label">points</div>
          {finalScore.winner === 'cons' && <div className="sc-crown">👑</div>}
        </div>
      </div>

      {finalScore.winner === 'tie' && (
        <div className="overall-tie-banner">⚖️ Overall: Tie</div>
      )}

      <h4 className="results-section-title">Phase by Phase</h4>
      <div className="phase-results-list">
        {PHASES.map((phase, i) => {
          const r = aggregated[phase.id];
          return (
            <div key={phase.id} className={`prl-row ${r?.result ? 'result-' + r.result : 'pending'}`}>
              <span className="prl-num">{i + 1}</span>
              <span className="prl-name">{phase.name}</span>
              <span className={`prl-verdict ${r?.result ? 'result-' + r.result : ''}`}>
                {r?.result
                  ? r.result === 'pro' ? teamPro : r.result === 'cons' ? teamCons : 'Tie'
                  : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Orator of the Day */}
      {(goldProNominees.length > 0 || goldConsNominees.length > 0) && (
        <div className="orator-day-section">
          <h4 className="results-section-title">⭐ Orator of the Day Candidates</h4>
          {goldProNominees.length > 0 && (
            <div className="otd-group">
              <span className="otd-team" style={{ color: 'var(--pro-color)' }}>{teamPro}</span>
              {goldProNominees.map((n, i) => (
                <span key={i} className="otd-name gold">{n.name} <small>({n.phase})</small></span>
              ))}
            </div>
          )}
          {goldConsNominees.length > 0 && (
            <div className="otd-group">
              <span className="otd-team" style={{ color: 'var(--cons-color)' }}>{teamCons}</span>
              {goldConsNominees.map((n, i) => (
                <span key={i} className="otd-name gold">{n.name} <small>({n.phase})</small></span>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="btn-export" onClick={onShowExport}>
        📄 Export Final Verdict
      </button>
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────
function ExportModal({ aggregated, finalScore, teamPro, teamCons, topic, allAnswers, numJudges, sessionData, onClose }) {
  const exportRef = useRef();

  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div ref={exportRef} className="export-doc">
          <div className="export-header">
            <h1>Botta e Risposta — World Cup 2026</h1>
            <h2>Final Verdict</h2>
            {topic && <p className="export-topic">"{topic}"</p>}
            <p className="export-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="export-score">
            <div className="es-team pro">
              <span className="es-name">{teamPro}</span>
              <span className="es-pts">{finalScore.proPoints} pts</span>
            </div>
            <div className="es-vs">vs</div>
            <div className="es-team cons">
              <span className="es-name">{teamCons}</span>
              <span className="es-pts">{finalScore.consPoints} pts</span>
            </div>
          </div>

          <div className="export-winner">
            Winner: <strong>{finalScore.winner === 'pro' ? teamPro : finalScore.winner === 'cons' ? teamCons : 'Tie'}</strong>
          </div>

          <table className="export-table">
            <thead>
              <tr><th>#</th><th>Phase</th><th>Winner</th></tr>
            </thead>
            <tbody>
              {PHASES.map((phase, i) => {
                const r = aggregated[phase.id];
                return (
                  <tr key={phase.id}>
                    <td>{i + 1}</td>
                    <td>{phase.name}</td>
                    <td>{r?.result ? (r.result === 'pro' ? teamPro : r.result === 'cons' ? teamCons : 'Tie') : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button className="btn-print" onClick={handlePrint}>🖨 Print / Save as PDF</button>
      </div>
    </div>
  );
}
