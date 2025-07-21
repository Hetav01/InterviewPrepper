import "react"
import { useState, useEffect } from "react";
import { InterviewChallenge } from "./InterviewChallenge";
import { ScenarioChallenge } from "./ScenarioChallenge";
import { useApi } from "../utils/Api";
import OnboardingModal from "../components/OnboardingModal";

export function ChallengeGenerator() {
    // State for current challenge data
    const [currentChallenges, setCurrentChallenges] = useState([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Form state
    const [difficulty, setDifficulty] = useState("Easy");
    const [topic, setTopic] = useState("");
    const [challengeType, setChallengeType] = useState("mcq"); // 'mcq' or 'scenario'
    const [numQuestions, setNumQuestions] = useState(5);
    const [selectedAnswers, setSelectedAnswers] = useState([]);

    // Quota state
    const [quotas, setQuotas] = useState({
        interview: { quota_remaining: 0, total_daily_quota: 10 },
        scenario: { quota_remaining: 0, total_daily_quota: 10 }
    });
    const [quotaLoading, setQuotaLoading] = useState(true);
    
    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);

    const { 
        generateChallenge, 
        ensureQuotasInitialized, 
        getAllQuotas,
        getUserStats
    } = useApi();

    // Initialize quotas on component mount
    useEffect(() => {
        initializeComponent();
    }, []);
    
    // Check if user is new and show onboarding
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('intrvw_onboarding_completed');
        if (!hasSeenOnboarding) {
            // Small delay to ensure component is fully loaded
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);
    
    // Auto-adjust num questions when challenge type changes
    useEffect(() => {
        if (challengeType === 'scenario' && numQuestions > 3) {
            setNumQuestions(3);
        }
    }, [challengeType]);

    const currentQuotaType = challengeType === 'mcq' ? 'interview' : 'scenario';
    const isQuotaDepleted = quotas?.[currentQuotaType]?.quota_remaining <= 0;

    const initializeComponent = async () => {
        try {
            setQuotaLoading(true);
            await fetchQuotas();
        } catch (error) {
            console.error('Failed to initialize component:', error);
            setError('Failed to load quota information. Please refresh the page.');
        } finally {
            setQuotaLoading(false);
        }
    };

    const fetchQuotas = async () => {
        try {
            const quotaData = await ensureQuotasInitialized();
            setQuotas(quotaData.quotas);
            setError(null);
        } catch (error) {
            console.error('Error fetching quotas:', error);
            setError('Failed to load quota information: ' + error.message);
        }
    };

    const generateChallengeHandler = async () => {
        // Validation
        if (!topic.trim()) {
            setError('Please enter a topic for your challenge.');
            return;
        }

        if (topic.trim().length < 2) {
            setError('Topic must be at least 2 characters long.');
            return;
        }

        // Check quota
        const currentQuotaType = challengeType === 'mcq' ? 'interview' : 'scenario';
        if (quotas[currentQuotaType]?.quota_remaining <= 0) {
            setError(`You have reached your daily quota for ${challengeType === 'mcq' ? 'interview' : 'scenario'} challenges. Please try again tomorrow.`);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setCurrentChallenges([]);
            setCurrentChallengeIndex(0);

            console.log('Generating challenge with params:', {
                challengeType: challengeType === 'mcq' ? 'interview' : challengeType,
                difficulty,
                topic: topic.trim(),
                numQuestions
            });

            const result = await generateChallenge(
                challengeType === 'mcq' ? 'interview' : challengeType,
                difficulty,
                topic.trim(),
                numQuestions
            );

            console.log('Challenge generation result:', result);

            if (result.challenges && result.challenges.length > 0) {
                setCurrentChallenges(result.challenges);
                setCurrentChallengeIndex(0);
                setSelectedAnswers(Array(result.challenges.length).fill(null));
                
                // Update quotas after successful generation
                await fetchQuotas();
            } else {
                setError('No challenges were generated. Please try again.');
            }
        } catch (error) {
            console.error('Error generating challenge:', error);
            setError('Failed to generate challenge: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetChallengeHandler = () => {
        console.log('Resetting challenge content and settings...');
        
        // Reset all challenge-related state
        setCurrentChallenges([]);
        setCurrentChallengeIndex(0);
        setSelectedAnswers([]);
        setError(null);
        
        // Reset form state completely
        setTopic('');
        setDifficulty('Easy');
        setNumQuestions(challengeType === 'scenario' ? 3 : 5);
        
        console.log('Challenge content and settings reset');
    };
    
    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('intrvw_onboarding_completed', 'true');
    };

    const getNextResetTime = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diffMs = tomorrow - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHours}h ${diffMinutes}m`;
    };

    const getCurrentChallenge = () => {
        if (currentChallenges.length === 0) return null;
        return currentChallenges[currentChallengeIndex];
    };

    const goToNextChallenge = () => {
        if (currentChallengeIndex < currentChallenges.length - 1) {
            setCurrentChallengeIndex(currentChallengeIndex + 1);
        }
    };

    const goToPreviousChallenge = () => {
        if (currentChallengeIndex > 0) {
            setCurrentChallengeIndex(currentChallengeIndex - 1);
        }
    };

    const handleSelectAnswer = (questionIndex, answerIndex) => {
        setSelectedAnswers(prev => {
            const updated = [...prev];
            updated[questionIndex] = answerIndex;
            return updated;
        });
    };

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


    function renderQuotaInfo() {
        if (quotaLoading) {
            return <div className="quota-info">Loading quota information...</div>;
        }

        const currentQuotaType = challengeType === 'mcq' ? 'interview' : 'scenario';
        const currentQuota = quotas[currentQuotaType];
        
        return (
            <div className="quota-info">
                <div className="quota-display">
                    <span className="quota-text">
                        {challengeType === 'mcq' ? 'Interview' : 'Scenario'} Challenges remaining: 
                        <strong> {currentQuota?.quota_remaining || 0}/{currentQuota?.total_daily_quota || 10}</strong>
                    </span>
                    {currentQuota?.quota_remaining === 0 && (
                        <span className="quota-reset">
                            Resets in: {getNextResetTime()}
                        </span>
                    )}
                </div>
                {currentQuota?.quota_remaining === 0 && (
                    <div className="quota-limit-message">
                        <div className="quota-limit-text">
                            <strong>Sorry! You have reached your quota limit</strong>
                            <p>Your quota will reset in 24 hours.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderChallengeNavigation() {
        if (currentChallenges.length <= 1) return null;

        return (
            <div className="challenge-navigation">
                <button 
                    onClick={goToPreviousChallenge}
                    disabled={currentChallengeIndex === 0}
                    className="nav-button"
                >
                    ← Previous
                </button>
                <span className="challenge-counter">
                    {currentChallengeIndex + 1} of {currentChallenges.length}
                </span>
                <button 
                    onClick={goToNextChallenge}
                    disabled={currentChallengeIndex === currentChallenges.length - 1}
                    className="nav-button"
                >
                    Next →
                </button>
            </div>
        );
    }

    // Function to render the correct challenge component based on challengeType
    function renderChallengeComponent() {
        const currentChallenge = getCurrentChallenge();

        if (isLoading) {
            return (
                <div className="challenge-loading-message">
                    <div className="loading-spinner"></div>
                    <p>Generating your challenge...</p>
                </div>
            );
        }
        
        if (!currentChallenge) {
            return (
                <div className="no-challenge-message">
                    <p>No challenge generated yet. Fill out the form above and click "Generate Challenge" to get started!</p>
                </div>
            );
        }

        if (challengeType === "mcq") {
            return (
                <InterviewChallenge 
                    key={currentChallenge.id || currentChallengeIndex}
                    challenge={currentChallenge} 
                    topic={topic} 
                    numQuestions={numQuestions} 
                    difficulty={difficulty} 
                    selectedOption={selectedAnswers[currentChallengeIndex]}
                    onSelectOption={answerIndex => handleSelectAnswer(currentChallengeIndex, answerIndex)}
                    disabled={isQuotaDepleted}
                />
            );
        } else {
            return (
                <ScenarioChallenge 
                    challenge={currentChallenge} 
                    topic={topic} 
                    numQuestions={numQuestions} 
                    difficulty={difficulty} 
                    disabled= {isQuotaDepleted}
                />
            );
        }
    }

    return (
        <div className="challenge-generator-panel">
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleOnboardingClose} 
            />
            
            <div className="challenge-generator-header">
                <h1 className="challenge-title">Ace your IntrVw!</h1>
                <p>Generate personalized ML interview challenges to enhance your preparation</p>
            </div>
            
            <div className="challenge-generator-container">
                <div className="challenge-ui-panel">
                    {renderChallengeTypeSelector()}
                    {renderQuotaInfo()}
                    
                    <div className="challenge-form-row">
                        <div className="form-control">
                            <label htmlFor="num-questions" disabled={isQuotaDepleted}>Questions (max {challengeType === 'scenario' ? 3 : 7}):</label>
                            <input
                                id="num-questions"
                                type="number"
                                min={1}
                                max={challengeType === 'scenario' ? 3 : 7}
                                value={numQuestions}
                                onChange={e => {
                                    let val = Number(e.target.value);
                                    if (val < 1) val = 1;
                                    if (val > (challengeType === 'scenario' ? 3 : 7)) val = challengeType === 'scenario' ? 3 : 7;
                                    setNumQuestions(val);
                                }}
                                disabled={isQuotaDepleted}
                                className="form-input small"
                            />
                        </div>
                        
                        <div className="form-control">
                            <label htmlFor="difficulty-select" disabled={isQuotaDepleted}>Difficulty:</label>
                            <select
                                id="difficulty-select"
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                className="form-input small"
                                disabled={isQuotaDepleted}
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        
                        <div className="form-control topic-control" disabled={isQuotaDepleted}>
                            <label htmlFor="challenge-input" disabled={isQuotaDepleted}>Topic Name:</label>
                            <input
                                id="challenge-input"
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="form-input topic-input"
                                placeholder="e.g. Neural Networks, SVM, etc."
                                disabled={isQuotaDepleted}
                            />
                        </div>
                        
                        <div className="form-control">
                            <label>&nbsp;</label>
                            <div className="button-group">
                                <button
                                    className="generate-challenge-btn"
                                    onClick={generateChallengeHandler}
                                    disabled={isLoading || quotaLoading || isQuotaDepleted}
                                >
                                    {isLoading ? 'Generating...' : 'Generate Challenge'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Error message */}
                    {error && (
                        <div className="challenge-error-message">
                            {error}
                        </div>
                    )}
                </div>
                
                <div className="challenge-content-panel">
                    {renderChallengeNavigation()}
                    {renderChallengeComponent()}
                </div>
                
                {/* Reset button - only show when challenges are generated */}
                {currentChallenges.length > 0 && (
                    <div className="reset-button-container">
                        <button
                            className="reset-challenge-btn"
                            onClick={resetChallengeHandler}
                            disabled={isLoading || quotaLoading}
                        >
                            Reset Challenge
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}