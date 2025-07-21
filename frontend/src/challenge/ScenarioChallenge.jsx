import React, { useState } from "react";
import { useApi } from "../utils/Api";
import { EditIcon, LightbulbIcon, ZapIcon, BrainIcon } from "../ExtraComponents/icons";

/**
 * Scenario Challenge Data Model Example:
 * {
 *   id: string,
 *   title: string, // The scenario prompt
 *   questions: string, // JSON string of questions array
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
  const { submitScenarioAnswer } = useApi();

  // Defensive check
  if (!challenge) {
    return (
      <div className="defensive-check-card">
        <span className="defensive-check-error">No scenario loaded.</span>
        <div className="defensive-check-info">
                          <div><strong>Topic:</strong> {topic || <span className="placeholder-text">N/A</span>}</div>
                <div><strong>Number of Questions:</strong> {numQuestions || <span className="placeholder-text">N/A</span>}</div>
                <div><strong>Difficulty:</strong> {difficulty || <span className="placeholder-text">N/A</span>}</div>
        </div>
      </div>
    );
  }

  // Parse questions from JSON string
  let questions = [];
  try {
    if (typeof challenge.questions === 'string') {
      questions = JSON.parse(challenge.questions);
    } else if (Array.isArray(challenge.questions)) {
      questions = challenge.questions;
    } else {
      console.error('Invalid questions format:', challenge.questions);
      questions = [];
    }
  } catch (error) {
    console.error('Error parsing questions:', error);
    questions = [];
  }

  // If no questions were parsed, show error
  if (questions.length === 0) {
    return (
      <div className="defensive-check-card">
        <span className="defensive-check-error">No questions available in this scenario.</span>
        <div className="defensive-check-info">
                          <div><strong>Topic:</strong> {topic || <span className="placeholder-text">N/A</span>}</div>
                <div><strong>Difficulty:</strong> {difficulty || <span className="placeholder-text">N/A</span>}</div>
        </div>
      </div>
    );
  }

  // State management
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [feedbacks, setFeedbacks] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(Array(questions.length).fill(false));
  const [errors, setErrors] = useState(Array(questions.length).fill(null));

  // Submit answer to backend API
  const submitAnswer = async (questionIndex) => {
    if (submitting[questionIndex] || feedbacks[questionIndex]) return;
    
    const userAnswer = answers[questionIndex];
    if (!userAnswer.trim()) {
      setErrors(prev => prev.map((e, i) => (i === questionIndex ? 'Please enter an answer before submitting.' : e)));
      return;
    }

    try {
      setSubmitting(prev => prev.map((s, i) => (i === questionIndex ? true : s)));
      setErrors(prev => prev.map((e, i) => (i === questionIndex ? null : e)));

      console.log('Submitting answer for scenario:', {
        scenarioId: challenge.id,
        questionIndex: questionIndex,
        userAnswer: userAnswer.trim()
      });

      const response = await submitScenarioAnswer(
        challenge.id,
        questionIndex,
        userAnswer.trim()
      );

      console.log('Answer submission response:', response);

      // Create feedback object from API response
      const feedback = {
        is_correct: response.score >= 70, // Consider 70+ as correct
        score: response.score,
        feedback_text: response.feedback,
        correct_answer: response.correct_answer
      };

      setFeedbacks(prev => prev.map((f, i) => (i === questionIndex ? feedback : f)));

    } catch (error) {
      console.error('Error submitting answer:', error);
      setErrors(prev => prev.map((e, i) => (i === questionIndex ? 'Failed to submit answer: ' + error.message : e)));
    } finally {
      setSubmitting(prev => prev.map((s, i) => (i === questionIndex ? false : s)));
    }
  };

  const handleInputChange = (idx, value) => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? value : a)));
    // Clear error when user starts typing
    if (errors[idx]) {
      setErrors(prev => prev.map((e, i) => (i === idx ? null : e)));
    }
  };

  const getQuestionPrompt = (question, index) => {
    // Handle different question formats
    if (typeof question === 'string') {
      return question;
    } else if (question && question.prompt) {
      return question.prompt;
    } else if (question && question.question) {
      return question.question;
    } else {
      return `Question ${index + 1}`;
    }
  };

  return (
    <div className="scenario-challenge-container">
      <div className="scenario-challenge-header">
        <div className="scenario-difficulty-badge">
          <span className="difficulty-icon">
            <ZapIcon size={18} color="currentColor" />
          </span>
          <span className={`difficulty-text ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>
      
      <div className="scenario-description-section">
        <h3 className="scenario-description-title">
          <BrainIcon size={22} color="currentColor" style={{ marginRight: '0.5rem' }} />
          Scenario
        </h3>
        <p className="scenario-description-text">{challenge.title}</p>
      </div>
      
      <div className="scenario-questions-section">
        <h4 className="scenario-questions-title">❓ Questions & Answers</h4>
        <div className="scenario-questions-container">
          {questions.map((q, idx) => (
            <div 
              key={idx} 
              className="scenario-question-card"
            >
              <div className="scenario-question-header">
                <div className="question-number-badge">
                  {idx + 1}
                </div>
                <h5 className="scenario-question-prompt">
                  {getQuestionPrompt(q, idx)}
                </h5>
              </div>
              
              <div className="scenario-answer-section">
                <label className="scenario-answer-label">Your Answer:</label>
                <textarea
                  className="scenario-answer-input"
                  value={answers[idx]}
                  onChange={e => handleInputChange(idx, e.target.value)}
                  disabled={!!feedbacks[idx]}
                  placeholder="Write your detailed answer here..."
                />
                
                {errors[idx] && (
                  <div className="scenario-error-message">
                    {errors[idx]}
                  </div>
                )}
                
                <button
                  className="scenario-submit-btn"
                  onClick={() => submitAnswer(idx)}
                  disabled={submitting[idx] || !!feedbacks[idx] || !answers[idx].trim()}
                >
                  {submitting[idx] ? (
                    <>
                      <span className="submit-spinner"></span>
                      Submitting...
                    </>
                  ) : feedbacks[idx] ? (
                    <>
                      <span className="submit-checkmark">✓</span>
                      Submitted
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
              
              {feedbacks[idx] && (
                <div className="scenario-feedback-section">
                  <div className="feedback-header">
                    <h4 className="feedback-title">
                      <BrainIcon size={20} color="currentColor" style={{ marginRight: '0.5rem' }} />
                      AI Feedback
                    </h4>
                    <div className="feedback-score-badge">
                      <span className="score-value">{feedbacks[idx].score}/100</span>
                      <span className={`score-status ${feedbacks[idx].is_correct ? 'correct' : 'needs-improvement'}`}>
                        {feedbacks[idx].is_correct ? '✓ Good Answer' : '✗ Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="feedback-content">
                    <div className="feedback-text-section">
                      <h5 className="feedback-section-title">
                        <EditIcon size={18} color="currentColor" style={{ marginRight: '0.5rem' }} />
                        Detailed Feedback
                      </h5>
                      <div className="feedback-text-content">
                        <p>{feedbacks[idx].feedback_text}</p>
                      </div>
                    </div>
                    
                    {feedbacks[idx].correct_answer && (
                      <div className="suggested-answer-section">
                        <h5 className="feedback-section-title">
                          <LightbulbIcon size={18} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          Suggested Answer
                        </h5>
                        <div className="suggested-answer-content">
                          <p>{feedbacks[idx].correct_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
