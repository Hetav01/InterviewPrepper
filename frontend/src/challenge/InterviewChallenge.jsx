import "react";
import { useState } from "react";
import { useApi } from "../utils/Api";
import { ChecklistIcon, LightbulbIcon, ZapIcon } from "../ExtraComponents/icons";

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
  const { submitInterviewAnswer } = useApi();
  
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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  // the option should be string,
  const options = typeof challenge.options === "string" ? JSON.parse(challenge.options) : challenge.options;

  const handleOptionSelect = async (optionIndex) => {
    if (selectedOption !== null || submitting || submitted) {
      return;
    }

    try {
      setSubmitting(true);
      onSelectOption(optionIndex);
      
      // Calculate time taken
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      
      // Submit answer to backend
      console.log('Submitting interview answer:', {
        challengeId: challenge.id,
        userAnswerId: optionIndex,
        timeTaken: timeTaken
      });

      const response = await submitInterviewAnswer(
        challenge.id,
        optionIndex,
        timeTaken
      );

      console.log('Interview answer submission response:', response);
      
      setSubmitted(true);
      setShouldShowExplanation(true);
      
    } catch (error) {
      console.error('Error submitting interview answer:', error);
      // Still show explanation even if submission fails
      setShouldShowExplanation(true);
    } finally {
      setSubmitting(false);
    }
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
          <span className="difficulty-icon">
            <ZapIcon size={18} color="currentColor" />
          </span>
          <span className={`difficulty-text ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>
      
      <div className="mcq-question-section">
        <h3 className="mcq-question-title">
                      <ChecklistIcon size={22} color="currentColor" style={{ marginRight: '0.5rem' }} />
          Question
        </h3>
        <p className="mcq-question-text">{challenge.title}</p>
      </div>
      
      <div className="mcq-options-section">
        <h4 className="mcq-options-title">
          <ChecklistIcon size={20} color="currentColor" style={{ marginRight: '0.5rem' }} />
          Choose the correct answer:
        </h4>
        <div className="mcq-options-container" >
          {options.map((option, index) => (
            <div
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionSelect(index)}
              style={{ cursor: selectedOption !== null || submitting ? 'not-allowed' : 'pointer' }}
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
        
        {submitting && (
          <div className="submission-status">
            <span className="submit-spinner"></span>
            Submitting your answer...
          </div>
        )}
        
        {submitted && (
          <div className="submission-status success">
            <span className="submit-checkmark">✓</span>
            Answer submitted successfully!
          </div>
        )}
      </div>
      
      {shouldShowExplanation && selectedOption !== null && (
        <div className="mcq-explanation-section">
          <h4 className="mcq-explanation-title">
            <LightbulbIcon size={20} color="currentColor" style={{ marginRight: '0.5rem' }} />
            Explanation
          </h4>
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
