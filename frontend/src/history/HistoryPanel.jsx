import React, { useState, useEffect } from "react";
import { useApi } from "../utils/Api";
import AnimatedNumber from "./AnimatedNumber";
import HistoryStatsCard from "./HistoryStatsCard";
import HistoryFiltersSort from "./HistoryFiltersSort";
import HistorySearchBar from "./HistorySearchBar";
import HistoryTopicBreakdown from "./HistoryTopicBreakdown";
import { HistoryScoreTracker } from "./HistoryScoreTracker";
import { EditIcon, LightbulbIcon, BookIcon, WarningIcon, ChecklistIcon, ZapIcon, BrainIcon, CelebrationIcon } from "../ExtraComponents/icons";

export function HistoryPanel() {
  const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all"); // all, interview, scenario
    const [sortBy, setSortBy] = useState("date"); // date, difficulty, topic
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [expandedDates, setExpandedDates] = useState(new Set(["Today"])); // Keep today expanded by default
    const [searchQuery, setSearchQuery] = useState("");


    const { getChallengeHistory, getUserStats } = useApi();

  useEffect(() => {
        loadHistoryData();
    }, []);

    const loadHistoryData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load both history and stats
            const [historyData, statsData] = await Promise.all([
                getChallengeHistory(),
                getUserStats()
            ]);

            console.log('History data loaded:', historyData);
            console.log('Challenges with user answers:', historyData.challenges?.filter(c => 
                (c.type === 'interview' && c.user_answer) || 
                (c.type === 'scenario' && c.user_answers && c.user_answers.length > 0)
            ));

            setHistory(historyData.challenges || []);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading history:', error);
            setError('Failed to load challenge history: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAndSortedHistory = () => {
        let filtered = history;

        // Apply filter
        if (filter === "interview") {
            filtered = history.filter(challenge => challenge.type === "interview");
        } else if (filter === "scenario") {
            filtered = history.filter(challenge => challenge.type === "scenario");
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(challenge =>
                (challenge.title && challenge.title.toLowerCase().includes(q)) ||
                (challenge.topic && challenge.topic.toLowerCase().includes(q)) ||
                (challenge.explanation && challenge.explanation.toLowerCase().includes(q))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date":
                    return new Date(b.date_created) - new Date(a.date_created);
                case "difficulty":
                    const difficultyOrder = { "Easy": 1, "Medium": 2, "Hard": 3 };
                    return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
                case "topic":
                    return a.topic.localeCompare(b.topic);
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const groupChallengesByDate = (challenges) => {
        const groups = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        challenges.forEach(challenge => {
            const date = new Date(challenge.date_created);
            const dateStr = date.toDateString();
            
            let groupKey;
            if (dateStr === today.toDateString()) {
                groupKey = "Today";
            } else if (dateStr === yesterday.toDateString()) {
                groupKey = "Yesterday";
            } else {
                groupKey = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(challenge);
        });

        return groups;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const openChallengeModal = (challenge) => {
        setSelectedChallenge(challenge);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedChallenge(null);
    };

    const toggleDateExpansion = (dateGroup) => {
        setExpandedDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dateGroup)) {
                newSet.delete(dateGroup);
            } else {
                newSet.add(dateGroup);
            }
            return newSet;
        });
    };

    const getTodaysChallenges = () => {
        const today = new Date();
        const todaysDateStr = today.toDateString();
        
        return history.filter(challenge => {
            const challengeDate = new Date(challenge.date_created);
            return challengeDate.toDateString() === todaysDateStr;
        });
    };

    const todaysCount = getTodaysChallenges().length;

    const renderChallengeCard = (challenge) => {
        const isInterview = challenge.type === "interview";
        
        // Debug logging
        if (isInterview && challenge.user_answer) {
            console.log('Interview challenge with answer:', challenge.id, challenge.user_answer);
        }
        if (!isInterview && challenge.user_answers) {
            console.log('Scenario challenge with answers:', challenge.id, challenge.user_answers);
        }
        
        // Get answer status for the card
        let answerStatus = null;
        if (isInterview && challenge.user_answer) {
            answerStatus = {
                answered: true,
                correct: challenge.user_answer.is_correct,
                userAnswerId: challenge.user_answer.user_answer_id
            };
        } else if (!isInterview && challenge.user_answers && challenge.user_answers.length > 0) {
            // For scenarios, calculate average score
            const totalScore = challenge.user_answers.reduce((sum, answer) => sum + (answer.llm_score || 0), 0);
            const avgScore = totalScore / challenge.user_answers.length;
            answerStatus = {
                answered: true,
                correct: avgScore >= 70,
                averageScore: Math.round(avgScore)
            };
        }
        
        return (
            <div
                key={challenge.id}
                className="challenge-card modern"
                onClick={() => openChallengeModal(challenge)}
            >
                <div className="challenge-type-badge">
                    {isInterview ? 'Interview' : 'Scenario'}
                </div>
                
                {/* Answer status indicator */}
                {answerStatus && (
                    <div className={`answer-status-badge ${answerStatus.correct ? 'correct' : 'incorrect'}`}>
                        {isInterview ? (
                            answerStatus.correct ? '✓ Correct' : '✗ Incorrect'
                        ) : (
                            `${answerStatus.averageScore}% Avg`
                        )}
                    </div>
                )}
                
                <div className="challenge-main-content">
                    <h5 className="challenge-title">{challenge.title}</h5>
                    
                    <div className="challenge-meta">
                        <div className="meta-item">
                            <span className="meta-icon">
                  <ZapIcon size={18} color="currentColor" />
                </span>
                            <span>{challenge.topic}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">⚡</span>
                            <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
                                {challenge.difficulty}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">🕒</span>
                            <span>{formatTime(challenge.date_created)}</span>
                        </div>
                    </div>
                    
                    <div className="challenge-preview">
                        {isInterview ? (
                            <div className="challenge-preview-content">
                                <span>Multiple choice • {JSON.parse(challenge.options || '[]').length} options</span>
                                {answerStatus ? (
                                    answerStatus.correct ? (
                                        <span className="user-answer-preview">
                                            Correct answer: {String.fromCharCode(65 + challenge.correct_answer_id)}
                                        </span>
                                    ) : (
                                        <span className="user-answer-preview">
                                            Correct answer: {String.fromCharCode(65 + challenge.correct_answer_id)} • Your answer: {String.fromCharCode(65 + answerStatus.userAnswerId)}
                                        </span>
                                    )
                                ) : (
                                    <span className="user-answer-preview">
                                        Did not answer • Correct answer: {String.fromCharCode(65 + challenge.correct_answer_id)}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="challenge-preview-content">
                                <span>Open-ended scenario • {JSON.parse(challenge.questions || '[]').length} questions</span>
                                {answerStatus && (
                                    <span className="user-answer-preview">
                                        {challenge.user_answers.length} answer(s) submitted
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="challenge-arrow">→</div>
            </div>
        );
    };

    const renderChallengeModal = () => {
        if (!showModal || !selectedChallenge) return null;

        const isInterview = selectedChallenge.type === "interview";

        return (
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-type-badge">
                        {isInterview ? 'Interview Challenge' : 'Scenario Challenge'}
                    </div>
                        <button className="modal-close" onClick={closeModal}>×</button>
                    </div>
                    
                    <div className="modal-body">
                        <h3 className="modal-title">{selectedChallenge.title}</h3>
                        
                        <div className="modal-meta">
                            <span className="modal-topic">Topic: {selectedChallenge.topic}</span>
                            <span className={`modal-difficulty ${selectedChallenge.difficulty.toLowerCase()}`}>
                                Difficulty: {selectedChallenge.difficulty}
                            </span>
                            <span className="modal-date">
                                Date: {new Date(selectedChallenge.date_created).toLocaleString()}
                            </span>
                        </div>

                        {isInterview ? (
                            <div className="interview-content">
                                <div className="question-section">
                                    <h4>Question</h4>
                                    <p>{selectedChallenge.title}</p>
                                </div>
                                
                                <div className="options-section">
                                    <h4>Answer Options</h4>
                                    <div className="options-list">
                                        {JSON.parse(selectedChallenge.options || '[]').map((option, index) => {
                                            const isCorrect = index === selectedChallenge.correct_answer_id;
                                            const isUserChoice = selectedChallenge.user_answer && index === selectedChallenge.user_answer.user_answer_id;
                                            const hasUserAnswer = selectedChallenge.user_answer !== null;
                                            
                                            let optionClass = 'option-item';
                                            if (hasUserAnswer) {
                                                if (isCorrect) optionClass += ' correct-answer';
                                                if (isUserChoice && !isCorrect) optionClass += ' user-incorrect';
                                                if (isUserChoice && isCorrect) optionClass += ' user-correct';
                                            } else if (isCorrect) {
                                                optionClass += ' correct';
                                            }
                                            
                                            return (
                                                <div key={index} className={optionClass}>
                                                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                                    <span className="option-text">{option}</span>
                                                    {isCorrect && (
                                                        <span className="correct-indicator">✓ Correct Answer</span>
                                                    )}
                                                    {isUserChoice && hasUserAnswer && (
                                                        <span className={`user-choice-indicator ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                            {isCorrect ? '✓ Your answer (Correct!)' : '✗ Your answer'}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Show result summary for answered questions */}
                                {selectedChallenge.user_answer && (
                                    <div className="answer-result-section">
                                        <h4>Your Result</h4>
                                        <div className={`result-summary ${selectedChallenge.user_answer.is_correct ? 'correct' : 'incorrect'}`}>
                                            <div className="result-icon">
                                                {selectedChallenge.user_answer.is_correct ? 
                  <CelebrationIcon size={22} color="currentColor" /> : 
                  <BookIcon size={22} color="currentColor" />
                }
                                            </div>
                                            <div className="result-text">
                                                {selectedChallenge.user_answer.is_correct ? (
                                                    <span>Congratulations! You answered correctly.</span>
                                                ) : (
                                                    <span>Not quite right. Review the explanation below to learn more.</span>
                                                )}
                                            </div>
                                            {selectedChallenge.user_answer.time_taken_seconds && (
                                                <div className="result-time">
                                                    Time taken: {selectedChallenge.user_answer.time_taken_seconds}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="explanation-section">
                                    <h4>Explanation</h4>
                                    <p>{selectedChallenge.explanation || selectedChallenge.explaination}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="scenario-content">
                                <div className="scenario-question">
                                    <h4>Scenario</h4>
                                    <p>{selectedChallenge.title}</p>
                                </div>
                                
                                {selectedChallenge.questions && (
                                    <div className="scenario-questions">
                                        <h4>Questions & Your Answers</h4>
                                        <div className="questions-list">
                                            {JSON.parse(selectedChallenge.questions || '[]').map((question, index) => {
                                                const userAnswer = selectedChallenge.user_answers?.find(a => a.question_index === index);
                                                
                                                return (
                                                    <div key={index} className="question-item-container">
                                                        <div className="question-header">
                                                            <span className="question-number">{index + 1}.</span>
                                                            <div className="question-content">
                                                                <div className="question-text">
                                                                    {typeof question === 'string' ? question : question.prompt || question}
                                                                </div>
                                                                
                                                                {/* Individual Question Explanation */}
                                                                {question.explanation && (
                                                                    <div className="question-explanation">
                                                                        <h6>
                          <ChecklistIcon size={16} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          What to cover in your answer:
                        </h6>
                                                                        <p>{question.explanation}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {userAnswer ? (
                                                            <div className="user-answer-section">
                                                                <div className="user-answer-header">
                                                                    <h5>Your Answer</h5>
                                                                    <div className={`score-badge ${userAnswer.llm_score >= 70 ? 'good' : userAnswer.llm_score >= 50 ? 'fair' : 'needs-work'}`}>
                                                                        {userAnswer.llm_score}/100
                                                                    </div>
                                                                </div>
                                                                <div className="user-answer-text">
                                                                    {userAnswer.user_answer}
                                                                </div>
                                                                
                                                                {userAnswer.llm_feedback && (
                                                                    <div className="feedback-section">
                                                                        <h6>
                          <BrainIcon size={18} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          AI Feedback
                        </h6>
                                                                        <p>{userAnswer.llm_feedback}</p>
                                                                    </div>
                                                                )}
                                                                
                                                                {userAnswer.llm_correct_answer && (
                                                                    <div className="ideal-answer-section">
                                                                        <h6>
                          <LightbulbIcon size={16} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          Ideal Answer
                        </h6>
                                                                        <p>{userAnswer.llm_correct_answer}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="no-answer-section">
                                                                <p className="no-answer-text">Not answered yet</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Overall Scenario Guidance (separate from individual questions) */}
                                {selectedChallenge.correct_answer && (
                                    <div className="scenario-overall-guidance">
                                        <h4>
                          <BookIcon size={20} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          Overall Scenario Guidance
                        </h4>
                                        <div className="guidance-content">
                                            <p>{selectedChallenge.correct_answer}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedChallenge.explanation && (
                                    <div className="scenario-evaluation-criteria">
                                        <h4>
                          <ChecklistIcon size={20} color="currentColor" style={{ marginRight: '0.5rem' }} />
                          Evaluation Criteria
                        </h4>
                                        <div className="criteria-content">
                                            <p>{selectedChallenge.explanation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="history-panel">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <h3>Loading your challenge history...</h3>
                    <p>Preparing your progress insights</p>
                </div>
            </div>
        );
  }

  if (error) {
        return (
            <div className="history-panel">
                                    <div className="error-state">
                        <div className="error-icon">
                      <WarningIcon size={24} color="currentColor" />
                    </div>
                        <h3>Oops! Something went wrong</h3>
      <p>{error}</p>
                        <button onClick={loadHistoryData} className="retry-btn">
                            Try Again
                        </button>
                    </div>
    </div>
        );
  }

    const filteredHistory = getFilteredAndSortedHistory();
    const groupedHistory = groupChallengesByDate(filteredHistory);

  return (
    <div className="history-panel">
            <div className="history-header">
                <h1>Challenge History</h1>
                <p>Track your progress and review past challenges</p>
                <button 
                    className="refresh-history-btn"
                    onClick={loadHistoryData}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            <HistoryStatsCard stats={stats} todaysCount={todaysCount} />

            <HistoryScoreTracker history={history} />

            <div className="history-layout">
                <div className="history-main">
                    <HistoryFiltersSort filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy}>
                        <HistorySearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </HistoryFiltersSort>
                    
                    {filteredHistory.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                      <BookIcon size={48} color="currentColor" />
                    </div>
                            <h3>No challenges found</h3>
                            {filter === "all" ? (
                                <div>
                                    <p>You haven't completed any challenges yet.</p>
                                    <p>Start your ML interview preparation journey today!</p>
                                </div>
      ) : (
                                <p>No {filter} challenges found. Try a different filter.</p>
                            )}
                        </div>
                    ) : (
                        <div className="challenges-timeline">
                            {Object.entries(groupedHistory).map(([dateGroup, challenges]) => {
                                const isExpanded = expandedDates.has(dateGroup);
            return (
                                    <div key={dateGroup} className="date-group">
                                        <div 
                                            className="date-header clickable" 
                                            onClick={() => toggleDateExpansion(dateGroup)}
                                        >
                                            <div className="date-header-content">
                                                <h4>{dateGroup}</h4>
                                                <span className="challenge-count">
                                                    {challenges.length} {challenges.length === 1 ? 'challenge' : 'challenges'}
                                                </span>
                                            </div>
                                            <span className="expand-icon">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </div>
                                        {isExpanded && (
                                            <div className="challenges-list">
                                                {challenges.map(renderChallengeCard)}
                                            </div>
                                        )}
                                    </div>
            );
          })}
        </div>
      )}
                </div>
                
                <div className="history-sidebar">
                    <HistoryTopicBreakdown stats={stats} setSearchQuery={setSearchQuery} />
                </div>
            </div>
            
            {renderChallengeModal()}
    </div>
  );
}
