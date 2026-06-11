// src/phases.js
// All 6 phases of the debate with their questions and scoring logic

export const PHASES = [
  {
    id: 'phase1',
    name: 'Prologue',
    questions: [
      { id: 'q1', text: 'Which team better highlighted the significance of the matter at hand?', weight: 1/4, type: 'comparative' },
      { id: 'q2', text: 'Which team better defined the terms and summarized its argumentative line?', weight: 1/4, type: 'comparative' },
      { id: 'q3', text: 'Which team had the best verbal communication?', weight: 1/4, type: 'comparative' },
      { id: 'q4', text: 'Which team had the best para-verbal and non-verbal communication?', weight: 1/4, type: 'comparative' },
    ],
    // No macro groups in this phase
    macroGroups: [],
  },
  {
    id: 'phase2',
    name: 'Argumentation Pro and Dialogue',
    // 3 standalone comparative questions worth 1/3 each
    // + macro group (3 yes/no questions) worth 1/3 total
    questions: [
      // Macro group questions (combined worth 1/3)
      { id: 'q1', text: 'Did the Pro disputant bring at least two relevant and solid/consistent arguments?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'pro' },
      { id: 'q2', text: 'Did the Pro disputant have good verbal, para-verbal and non-verbal communication?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'pro' },
      { id: 'q3', text: 'Did the Socratic dialogue properly question and analyze the thesis?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'pro_dialogue' },
      // Standalone comparative questions
      { id: 'q4', text: 'Are the arguments still standing after the Socratic dialogue, or did the dialogue instill a reasonable doubt about those arguments?', weight: 1/3, type: 'comparative' },
      { id: 'q5', text: 'Which team better handled the exchange?', weight: 1/3, type: 'comparative' },
    ],
    macroGroups: [
      {
        id: 'mg1',
        questionIds: ['q1', 'q2', 'q3'],
        weight: 1/3,
        // Logic: if all Yes or all No → Tie
        // If at least one of q1/q2 is Yes and q3 is No → Pro
        // If at least one of q1/q2 is No and q3 is Yes → Cons
        logicType: 'phase2_pro',
      }
    ],
  },
  {
    id: 'phase3',
    name: 'Argumentation Cons and Dialogue',
    questions: [
      // Macro group questions (combined worth 1/3) — now q1/q2 are about CONS orator, q3 about PRO dialogue
      { id: 'q1', text: 'Did the Cons disputant bring at least two relevant and solid/consistent arguments?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'cons' },
      { id: 'q2', text: 'Did the Cons disputant have good verbal, para-verbal and non-verbal communication?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'cons' },
      { id: 'q3', text: 'Did the Socratic dialogue properly question and analyze the thesis?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'cons_dialogue' },
      // Standalone comparative
      { id: 'q4', text: 'Are the arguments still standing after the Socratic dialogue, or did the dialogue instill a reasonable doubt about those arguments?', weight: 1/3, type: 'comparative' },
      { id: 'q5', text: 'Which team better handled the exchange?', weight: 1/3, type: 'comparative' },
    ],
    macroGroups: [
      {
        id: 'mg1',
        questionIds: ['q1', 'q2', 'q3'],
        weight: 1/3,
        // Logic: if all Yes or all No → Tie
        // If at least one of q1/q2 is Yes and q3 is No → Cons (inverted from phase2!)
        // If at least one of q1/q2 is No and q3 is Yes → Pro
        logicType: 'phase3_cons',
      }
    ],
  },
  {
    id: 'phase4',
    name: 'Rebuttal Pro and Defense',
    questions: [
      // Macro group (first two yes/no questions)
      { id: 'q1', text: 'Was the Pro rebuttal punctual and incisive?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'pro' },
      { id: 'q2', text: 'Was there good coordination between the members of the Cons team?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'cons' },
      // Standalone comparative
      { id: 'q3', text: 'Are the crucial objections raised still standing after the defense, or did the defense of the thesis have a more convincing grip?', weight: 1/3, type: 'comparative' },
      { id: 'q4', text: 'Which team had the best verbal, para-verbal and non-verbal communication?', weight: 1/3, type: 'comparative' },
    ],
    macroGroups: [
      {
        id: 'mg1',
        questionIds: ['q1', 'q2'],
        weight: 1/3,
        // Both Yes or both No → Tie
        // q1=Yes, q2=No → Pro
        // q1=No, q2=Yes → Cons
        logicType: 'phase4_pro',
      }
    ],
  },
  {
    id: 'phase5',
    name: 'Rebuttal Cons and Defense',
    questions: [
      // Macro group — INVERTED: q1 about Cons, q2 about Pro
      { id: 'q1', text: 'Was the Cons rebuttal punctual and incisive?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'cons' },
      { id: 'q2', text: 'Was there good coordination between the members of the Pro team?', weight: null, type: 'yesno', macroGroup: 'mg1', subject: 'pro' },
      // Standalone comparative
      { id: 'q3', text: 'Are the crucial objections raised still standing after the defense, or did the defense of the thesis have a more convincing grip?', weight: 1/3, type: 'comparative' },
      { id: 'q4', text: 'Which team had the best verbal, para-verbal and non-verbal communication?', weight: 1/3, type: 'comparative' },
    ],
    macroGroups: [
      {
        id: 'mg1',
        questionIds: ['q1', 'q2'],
        weight: 1/3,
        // Both Yes or both No → Tie
        // q1=Yes, q2=No → Cons (inverted from phase4!)
        // q1=No, q2=Yes → Pro
        logicType: 'phase5_cons',
      }
    ],
  },
  {
    id: 'phase6',
    name: 'Epilogue',
    questions: [
      { id: 'q1', text: 'Which team better synthesized the argumentative lines and valorized its own strong points?', weight: 1/3, type: 'comparative' },
      { id: 'q2', text: 'Which team delivered the most impactful and incisive final statement?', weight: 1/3, type: 'comparative' },
      { id: 'q3', text: 'Which team had the best verbal, para-verbal and non-verbal communication?', weight: 1/3, type: 'comparative' },
    ],
    macroGroups: [],
  },
];

// ─── SCORING ENGINE ──────────────────────────────────────────────────────────

/**
 * Resolve a macro group to 'pro' | 'cons' | 'tie' given answers object
 * answers: { q1: 'yes'|'no', q2: 'yes'|'no', ... }
 */
function resolveMacroGroup(macroGroup, answers) {
  const { questionIds, logicType } = macroGroup;
  const vals = questionIds.map(id => answers[id]); // 'yes' | 'no' | undefined

  // If any answer is missing, can't resolve
  if (vals.some(v => !v)) return null;

  if (logicType === 'phase2_pro') {
    // q1=q1, q2=q2, q3=q3
    const [a1, a2, a3] = vals;
    if ((a1 === a2) && (a2 === a3)) return 'tie'; // all same
    if ((a1 === 'yes' || a2 === 'yes') && a3 === 'no') return 'pro';
    if ((a1 === 'no' || a2 === 'no') && a3 === 'yes') return 'cons';
    return 'tie';
  }

  if (logicType === 'phase3_cons') {
    // Same structure but pro/cons swapped
    const [a1, a2, a3] = vals;
    if ((a1 === a2) && (a2 === a3)) return 'tie';
    if ((a1 === 'yes' || a2 === 'yes') && a3 === 'no') return 'cons';
    if ((a1 === 'no' || a2 === 'no') && a3 === 'yes') return 'pro';
    return 'tie';
  }

  if (logicType === 'phase4_pro') {
    const [a1, a2] = vals;
    if (a1 === a2) return 'tie';
    if (a1 === 'yes' && a2 === 'no') return 'pro';
    if (a1 === 'no' && a2 === 'yes') return 'cons';
    return 'tie';
  }

  if (logicType === 'phase5_cons') {
    const [a1, a2] = vals;
    if (a1 === a2) return 'tie';
    if (a1 === 'yes' && a2 === 'no') return 'cons';
    if (a1 === 'no' && a2 === 'yes') return 'pro';
    return 'tie';
  }

  return null;
}

/**
 * Score a single phase for a single judge.
 * Returns: { result: 'pro'|'cons'|'tie'|null, breakdown: {...} }
 */
export function scorePhase(phase, answers) {
  if (!answers) return { result: null, breakdown: {} };

  let proScore = 0;
  let consScore = 0;
  const breakdown = {};

  // Process macro groups first
  for (const mg of phase.macroGroups) {
    const result = resolveMacroGroup(mg, answers);
    breakdown[mg.id] = result;
    if (result === 'pro') proScore += mg.weight;
    else if (result === 'cons') consScore += mg.weight;
    else if (result === 'tie') { proScore += mg.weight / 2; consScore += mg.weight / 2; }
  }

  // Process standalone comparative questions
  for (const q of phase.questions) {
    if (q.macroGroup) continue; // handled above
    if (!answers[q.id]) continue;
    const ans = answers[q.id]; // 'pro' | 'cons' | 'tie'
    breakdown[q.id] = ans;
    if (ans === 'pro') proScore += q.weight;
    else if (ans === 'cons') consScore += q.weight;
    else if (ans === 'tie') { proScore += q.weight / 2; consScore += q.weight / 2; }
  }

  let result = null;
  if (proScore > consScore) result = 'pro';
  else if (consScore > proScore) result = 'cons';
  else if (proScore === consScore && proScore > 0) result = 'tie';

  return { result, proScore, consScore, breakdown };
}

/**
 * Check if all questions in a phase are answered
 */
export function isPhaseComplete(phase, answers) {
  if (!answers) return false;

  // Check all standalone comparative questions
  for (const q of phase.questions) {
    if (q.macroGroup) continue;
    if (!answers[q.id]) return false;
  }

  // Check all yes/no questions
  for (const q of phase.questions) {
    if (q.type === 'yesno' && !answers[q.id]) return false;
  }

  return true;
}

/**
 * Aggregate phase results across all judges.
 * judgesAnswers: { judge1: { phase1: { q1: 'pro', ... }, ... }, ... }
 * Returns: { phase1: { result: 'pro'|'cons'|'tie', votes: { pro: n, cons: n, tie: n } }, ... }
 */
export function aggregateResults(judgesAnswers, numJudges) {
  const results = {};

  for (const phase of PHASES) {
    const votes = { pro: 0, cons: 0, tie: 0 };
    let validJudges = 0;

    for (let i = 1; i <= numJudges; i++) {
      const judgeKey = `judge${i}`;
      const judgePhaseAnswers = judgesAnswers?.[judgeKey]?.[phase.id];
      if (!judgePhaseAnswers) continue;

      const { result } = scorePhase(phase, judgePhaseAnswers);
      if (result) {
        votes[result]++;
        validJudges++;
      }
    }

    // Majority wins; tie if equal
    let phaseResult = null;
    if (validJudges > 0) {
      if (votes.pro > votes.cons && votes.pro > votes.tie) phaseResult = 'pro';
      else if (votes.cons > votes.pro && votes.cons > votes.tie) phaseResult = 'cons';
      else phaseResult = 'tie';
    }

    results[phase.id] = { result: phaseResult, votes, validJudges };
  }

  return results;
}

/**
 * Calculate final score from aggregated phase results.
 * Each phase won = 1 point, tie = 0.5, lost = 0
 */
export function calculateFinalScore(aggregatedResults) {
  let proPoints = 0;
  let consPoints = 0;

  for (const phase of PHASES) {
    const r = aggregatedResults[phase.id];
    if (!r || !r.result) continue;
    if (r.result === 'pro') { proPoints += 1; }
    else if (r.result === 'cons') { consPoints += 1; }
    else if (r.result === 'tie') { proPoints += 0.5; consPoints += 0.5; }
  }

  return { proPoints, consPoints, winner: proPoints > consPoints ? 'pro' : consPoints > proPoints ? 'cons' : 'tie' };
}
