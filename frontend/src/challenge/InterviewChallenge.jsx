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

export function InterviewChallenge({challenge, showExplanation = false}) {
  // Defensive check to prevent crash if challenge or options is undefined
  if (!challenge || !challenge.options) {
    return <div style={{ color: 'red', padding: 20 }}>No question loaded.</div>;
  }

  // The challenge is the content of the challenge, a topic that the user will want questions on.
  // this is the mcq challenge to answer questions about differnt ML and DL topics that often get asked in the interview.
  const [selectedOption, setSelectedOption] = useState(null);
  const [shouldShowExplanation, setShouldShowExplanation] = useState(showExplanation);

  // the option should be string,
  const options = typeof challenge.options === "string" ? JSON.parse(challenge.options) : challenge.options;

  const handleOptionSelect = (optionIndex) => {
    if (selectedOption !== null) {
      return;
    }
    setSelectedOption(optionIndex);
    setShouldShowExplanation(true);
  }

  const getOptionClass = (optionIndex) => {
    if (selectedOption === null) {
      return "option";
    }
    if (optionIndex === challenge.correct_answer_id) {
      return "option correct";
    }
    if (selectedOption === optionIndex && optionIndex !== challenge.correct_answer_id) {
      return "option incorrect";
    }
    return "option";
  }
  
  
  return <div className="challenge-display">
    <p><strong>Difficulty:</strong> {challenge.difficulty}</p>
    <p className="challenge-title">{challenge.title}</p>
    <div className="challenge-options">
      {options.map((option, index) => (
        <div
          key={index}
          className={getOptionClass(index)}
          onClick={() => handleOptionSelect(index)}
        >
          {option}
        </div>
      ))}
      {shouldShowExplanation && selectedOption !== null && (
        <div className="explanation">
          <h4>Explanation</h4>
          <p>{challenge.explaination}</p>
        </div>
      )}
    </div>
  </div>;
}
