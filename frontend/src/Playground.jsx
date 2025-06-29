import { useState } from 'react';

export default function Playground() {
  const [challengeType, setChallengeType] = useState('mcq');

  function renderChallengeTypeSelector() {
    return (
      <div className="challenge-type-toggle">
        <div className="toggle-track">
          <div className={`toggle-handle${challengeType === 'scenario' ? ' right' : ''}`}></div>
          <button
            className={`toggle-label left${challengeType === 'mcq' ? ' active' : ''}`}
            onClick={() => setChallengeType('mcq')}
            type="button"
            tabIndex={0}
            aria-pressed={challengeType === 'mcq'}
          >
            Interview
          </button>
          <button
            className={`toggle-label right${challengeType === 'scenario' ? ' active' : ''}`}
            onClick={() => setChallengeType('scenario')}
            type="button"
            tabIndex={0}
            aria-pressed={challengeType === 'scenario'}
          >
            Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Test the Orange Toggle</h2>
      {renderChallengeTypeSelector()}
      <div style={{marginTop: '2rem', fontSize: '1.1rem', color: 'var(--text-color)'}}>
        Selected: <b>{challengeType === 'mcq' ? 'Interview' : 'Scenario'}</b>
      </div>
    </div>
  );
}
 