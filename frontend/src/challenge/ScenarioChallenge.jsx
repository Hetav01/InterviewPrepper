import React, { useState } from "react";

/**
 * Scenario Challenge Data Model Example:
 * {
 *   id: string,
 *   title: string, // The scenario prompt
 *   correct_answer: string, // The ideal answer (optional, for backend)
 *   difficulty: string, // easy, medium, hard
 *   topic: string, // topic name
 *   feedback: {
 *     is_correct: boolean,
 *     score: number, // 0-100
 *     feedback_text: string // 100-200 words
 *   }[] // feedback per question
 * }
 */

export function ScenarioChallenge({ challenge, topic, numQuestions, difficulty }) {
  // Defensive check
  if (!challenge || !challenge.questions) {
    return (
      <div className="defensive-check-card">
        <span className="defensive-check-error">No scenario loaded.</span>
        <div className="defensive-check-info">
          <div><strong>Topic:</strong> {topic || <span style={{ color: '#888' }}>N/A</span>}</div>
          <div><strong>Number of Questions:</strong> {numQuestions || <span style={{ color: '#888' }}>N/A</span>}</div>
          <div><strong>Difficulty:</strong> {difficulty || <span style={{ color: '#888' }}>N/A</span>}</div>
        </div>
      </div>
    );
  }

  // questions: array of scenario prompts
  const questions = challenge.questions;
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [feedbacks, setFeedbacks] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(Array(questions.length).fill(false));

  // Simulate backend feedback (replace with API call)
  const getFeedback = async (answer, idx) => {
    // TODO: Replace with real API call
    return new Promise(resolve => {
      setTimeout(() => {
        const isCorrect = answer.trim().length > 10; // Dummy logic
        resolve({
          is_correct: isCorrect,
          score: isCorrect ? 80 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 30),
          feedback_text: isCorrect
            ? "Great job! Your answer covered the key points. You demonstrated a solid understanding of the scenario. To improve, consider adding more real-world examples and structuring your response for clarity."
            : "Your answer missed some important aspects. Try to address the scenario more directly, provide specific examples, and elaborate on your reasoning. Review the core concepts and try again."
        });
      }, 1200);
    });
  };

  const handleInputChange = (idx, value) => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? value : a)));
  };

  const handleSubmit = async (idx) => {
    if (submitting[idx] || feedbacks[idx]) return;
    setSubmitting(prev => prev.map((s, i) => (i === idx ? true : s)));
    const feedback = await getFeedback(answers[idx], idx);
    setFeedbacks(prev => prev.map((f, i) => (i === idx ? feedback : f)));
    setSubmitting(prev => prev.map((s, i) => (i === idx ? false : s)));
  };

  return (
    <div className="challenge-display">
      <p><strong>Difficulty:</strong> {challenge.difficulty}</p>
      <p className="challenge-title">{challenge.title}</p>
      <div className="challenge-options">
        {questions.map((q, idx) => (
          <div key={idx} className="scenario-question-block" style={{ marginBottom: '2em', padding: '1em', background: 'var(--bg-color)', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.7em', color: 'var(--text-color)' }}>Scenario {idx + 1}: {q.prompt}</div>
            <textarea
              className="scenario-answer-input"
              style={{ width: '100%', minHeight: '4em', borderRadius: '0.375rem', border: '1.5px solid var(--border-color)', padding: '0.7em', fontSize: '1.05em', marginBottom: '0.7em', color: 'var(--text-color)', background: 'var(--bg-color)' }}
              value={answers[idx]}
              onChange={e => handleInputChange(idx, e.target.value)}
              disabled={!!feedbacks[idx]}
              placeholder="Write your answer here..."
            />
            <button
              className="generate-challenge-btn"
              style={{ marginTop: 0, marginBottom: '0.7em', minWidth: 120 }}
              onClick={() => handleSubmit(idx)}
              disabled={submitting[idx] || !!feedbacks[idx] || !answers[idx].trim()}
            >
              {submitting[idx] ? 'Submitting...' : feedbacks[idx] ? 'Submitted' : 'Submit'}
            </button>
            {feedbacks[idx] && (
              <div className="explanation" style={{ marginTop: '1em' }}>
                <h4>Feedback</h4>
                <div><strong>Score:</strong> {feedbacks[idx].score} / 100</div>
                <div><strong>Result:</strong> {feedbacks[idx].is_correct ? <span style={{ color: '#22c55e' }}>Correct</span> : <span style={{ color: 'var(--error-color)' }}>Incorrect</span>}</div>
                <p style={{ marginTop: '0.7em' }}>{feedbacks[idx].feedback_text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
