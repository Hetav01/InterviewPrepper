import "react";
import { useState } from "react";

/**
 * The question model in pydantic will look something like:
 * {
 *   "content": "Topic of the choice.",
 *   "options": ["A neural network is a type of decision tree", "A neural network is a type of decision tree", "A neural network is a type of decision tree", "A neural network is a type of decision tree"],
 *   "correctAnswer": 0 basically the index of the correct answer,
 *   explaination: "...." 
 * }
 * 
 */

export function InterviewChallenge({challenge, showExplanation = false, topic, numQuestions, difficulty, selectedOption, onSelectOption}) {
  // Defensive check to prevent crash if challenge or options is undefined
  if (!challenge || !challenge.options) {
    return (
      <div className="defensive-check-card">
        <span className="defensive-check-error">No question loaded.</span>
        <div className="defensive-check-info">
                <div><strong>Topic:</strong> {topic || <span className="placeholder-text">N/A</span>}</div>
                <div><strong>Number of Questions:</strong> {numQuestions || <span className="placeholder-text">N/A</span>}</div>
                <div><strong>Difficulty:</strong> {difficulty || <span className="placeholder-text">N/A</span>}</div>
        </div>
      </div>
    );
  }

  // The challenge is the content of the challenge, a topic that the user will want questions on.
  // this is the mcq challenge to answer questions about differnt ML and DL topics that often get asked in the interview.

  const [shouldShowExplanation, setShouldShowExplanation] = useState(showExplanation);

  // the option should be string,
  const options = typeof challenge.options === "string" ? JSON.parse(challenge.options) : challenge.options;

  const handleOptionSelect = (optionIndex) => {
    if (selectedOption !== null) {
      return;
    }
    onSelectOption(optionIndex);
    setShouldShowExplanation(true);
  }

  const getOptionClass = (optionIndex) => {
    if (selectedOption === null) {
      return "option mcq-option";
    }
    if (optionIndex === challenge.correct_answer_id) {
      return "option mcq-option correct";
    }
    if (selectedOption === optionIndex && optionIndex !== challenge.correct_answer_id) {
      return "option mcq-option incorrect";
    }
    return "option mcq-option";
  }
  
  
  return (
    <div className="mcq-challenge-container">
      <div className="mcq-challenge-header">
        <div className="mcq-difficulty-badge">
          <span className="difficulty-icon">⚡</span>
          <span className={`difficulty-text ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>
      
      <div className="mcq-question-section">
        <h3 className="mcq-question-title">📋 Question</h3>
        <p className="mcq-question-text">{challenge.title}</p>
      </div>
      
      <div className="mcq-options-section">
        <h4 className="mcq-options-title">📝 Choose the correct answer:</h4>
        <div className="mcq-options-container" >
          {options.map((option, index) => (
            <div
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="option-letter">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="option-content">
                <span className="option-text">{option}</span>
                {selectedOption !== null && index === challenge.correct_answer_id && (
                  <span className="correct-indicator">✓ Correct</span>
                )}
                {selectedOption === index && index !== challenge.correct_answer_id && (
                  <span className="incorrect-indicator">✗ Incorrect</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {shouldShowExplanation && selectedOption !== null && (
        <div className="mcq-explanation-section">
          <h4 className="mcq-explanation-title">💡 Explanation</h4>
          <div className="mcq-explanation-content">
            <p>{challenge.explanation || challenge.explaination}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MCQ Challenge Data Model Example:
 * {
 *   id: string,
 *   title: string, // The question or topic
 *   options: string[],
 *   correct_answer_id: number, // index of correct option
 *   explaination: string, // explanation for the answer
 *   difficulty: string, // easy, medium, hard
 *   topic: string, // topic name
 * }
 */
