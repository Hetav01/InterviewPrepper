import "react"
import { useState, useEffect } from "react";
import { InterviewChallenge } from "./InterviewChallenge";
import { ScenarioChallenge } from "./ScenarioChallenge";

export function ChallengeGenerator() {
    const [challenge, setChallenge] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [difficulty, setDifficulty] = useState("easy");
    const [quota, setQuota] = useState(10);
    const [challengeType, setChallengeType] = useState("mcq"); // 'mcq' or 'scenario'
    const  [numQuestions, setNumQuestions] = useState(5);
    const [topic, setTopic] = useState("");
    
    const fetchQuota = async() => {
        // To be implemented
    }

    const generateChallenge = async() => {
        // To be implemented
    }

    const getNextResetTime = async() => {
        // To be implemented
    }

    useEffect(() => {
        if (challengeType === 'scenario' && numQuestions > 3) {
            setNumQuestions(3);
        }
    }, [challengeType]);

    // Modern orange slider switch for challenge type selection
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

    // Add number of questions input, with max depending on challengeType
    function renderNumQuestionsInput() {
        const max = challengeType === 'scenario' ? 3 : 7;
        return (
            <div className="num-questions-ui">
                <label htmlFor="num-questions">Number of Questions:</label>
                <input
                    id="num-questions"
                    type="number"
                    min={1}
                    max={max}
                    value={numQuestions}
                    onChange={e => {
                        let val = Number(e.target.value);
                        if (val < 1) val = 1;
                        if (val > max) val = max;
                        setNumQuestions(val);
                    }}
                    className="num-questions-input"
                />
                <span style={{ marginLeft: '0.5em', color: 'var(--text-color)', fontSize: '0.95em' }}>
                    (max {max})
                </span>
            </div>
        );
    }

    function renderTopicInput() {
        return (
            <div className="topic-input-ui">
                <label htmlFor="topic-input">Topic Name:</label>
                <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="topic-input"
                    placeholder="e.g. Neural Networks, SVM, etc."
                />
            </div>
        );
    }

    // Function to render the correct challenge component based on challengeType
    function renderChallengeComponent(type) {
        if (type === "mcq") {
            return <InterviewChallenge challenge={challenge} topic={topic} numQuestions={numQuestions} difficulty={difficulty} />;
        } else {
            return <ScenarioChallenge challenge={challenge} topic={topic} numQuestions={numQuestions} difficulty={difficulty} />;
        }
    }

    return (
        <div className="challenge-container challenge-generator-ui">
            <h2 className="challenge-title">Interview Challenge Generator</h2>
            <div className="challenge-ui-panel">
                {renderChallengeTypeSelector()}
                <div className="challenge-common-row">
                    {renderNumQuestionsInput()}
                    <div className="difficulty-selector-ui">
                        <label htmlFor="difficulty-select">Difficulty:</label>
                        <select
                            id="difficulty-select"
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            className="difficulty-select"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>
                {renderTopicInput()}
                <button
                    className="generate-challenge-btn"
                    style={{
                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                        border: 'none',
                        borderRadius: '0.5em',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        padding: '0.7em 2.2em',
                        margin: '2em 0 0.5em 0',
                        cursor: 'pointer',
                        transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                    onClick={generateChallenge}
                    disabled={isLoading}
                >
                    {isLoading ? 'Generating...' : 'Generate Challenge'}
                </button>
                {/* Error message */}
                {error && <div className="challenge-error-message">{error}</div>}
            </div>
            <div className="challenge-content-panel">
                {renderChallengeComponent(challengeType)}
            </div>
        </div>
    );
}