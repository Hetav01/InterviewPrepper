import React, { useState, useEffect } from "react";
import { useApi } from "../utils/Api";

// Animated number component with smooth transitions
const AnimatedNumber = ({ value, duration = 1500, delay = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        let animationId;
        let timeoutId;
        
        const startAnimation = () => {
            let startTime = null;
            const startValue = 0;
            const endValue = value;

            const animate = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ultra-smooth easing function (ease-out-quart)
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                
                // Calculate current value with precise interpolation
                const currentValue = startValue + (endValue - startValue) * easeOutQuart;
                
                // Use different rounding strategies based on value and progress
                let smoothValue;
                if (endValue <= 10) {
                    // For small numbers, use continuous rounding for ultra-smooth effect
                    smoothValue = Math.round(currentValue);
                } else if (progress < 0.1) {
                    // Start very slowly for larger numbers
                    smoothValue = Math.floor(currentValue);
                } else {
                    // Smooth progression for larger numbers
                    smoothValue = Math.round(currentValue);
                }
                
                setDisplayValue(smoothValue);

                if (progress < 1) {
                    animationId = requestAnimationFrame(animate);
                } else {
                    // Ensure we end exactly at the target value
                    setDisplayValue(endValue);
                }
            };

            animationId = requestAnimationFrame(animate);
        };

        // Add delay for staggered effect
        if (delay > 0) {
            timeoutId = setTimeout(startAnimation, delay);
        } else {
            startAnimation();
        }

        // Cleanup function
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [value, duration, delay]);

    return <span>{displayValue}</span>;
};

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

    const renderStatsCard = () => {
        if (!stats) return null;

        const todaysChallenges = getTodaysChallenges();
        const todaysCount = todaysChallenges.length;

        return (
            <div className="stats-dashboard">
                <div className="stats-header">
                    <h3>Your Progress Dashboard</h3>
                    <p>Track your machine learning interview preparation journey</p>
                </div>
                
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-content">
                            <div className="stat-number">
                                <AnimatedNumber value={stats.totalChallenges} duration={1800} delay={200} />
                            </div>
                            <div className="stat-label">Total Challenges</div>
                            <div className="stat-sublabel">Keep it up!</div>
                        </div>
                    </div>
                    
                    <div className="stat-card interview">
                        <div className="stat-icon">💼</div>
                        <div className="stat-content">
                            <div className="stat-number">
                                <AnimatedNumber value={stats.interviewChallenges} duration={1600} delay={400} />
                            </div>
                            <div className="stat-label">Interview MCQs</div>
                            <div className="stat-sublabel">Quick knowledge tests</div>
                        </div>
                    </div>
                    
                    <div className="stat-card scenario">
                        <div className="stat-icon">🧠</div>
                        <div className="stat-content">
                            <div className="stat-number">
                                <AnimatedNumber value={stats.scenarioChallenges} duration={1600} delay={600} />
                            </div>
                            <div className="stat-label">Scenario Challenges</div>
                            <div className="stat-sublabel">Deep thinking practice</div>
                        </div>
                    </div>
                    
                    <div className="stat-card topics">
                        <div className="stat-icon">📚</div>
                        <div className="stat-content">
                            <div className="stat-number">
                                <AnimatedNumber value={Object.keys(stats.topicBreakdown).length} duration={1400} delay={800} />
                            </div>
                            <div className="stat-label">Topics Mastered</div>
                            <div className="stat-sublabel">Expand your knowledge</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span>Daily Goal Progress</span>
                        <span>
                            <AnimatedNumber value={todaysCount} duration={1600} delay={1000} />/10
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill animated" 
                            style={{ 
                                '--target-width': `${Math.min((todaysCount / 10) * 100, 100)}%`
                            }}
                        ></div>
                    </div>
                    <p className="progress-message">
                        {todaysCount >= 10 
                            ? `Amazing! You've completed ${todaysCount} challenges today and exceeded your daily goal!` 
                            : `${10 - todaysCount} more challenges to reach your daily goal!`
                        }
                    </p>
                </div>
            </div>
        );
    };

    const renderTopicBreakdown = () => {
        if (!stats || !stats.topicBreakdown) return null;

        const topTopics = Object.entries(stats.topicBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);

        return (
            <div className="topic-insights">
                <h4>Your Focus Areas</h4>
                <div className="topic-list">
                    {topTopics.map(([topic, count]) => (
                        <div key={topic} className="topic-item">
                            <div className="topic-info">
                                <span className="topic-name">{topic}</span>
                                <span className="topic-description">
                                    {count === 1 ? '1 challenge' : `${count} challenges`}
                                </span>
                            </div>
                            <div className="topic-badge">{count}</div>
                        </div>
                    ))}
                </div>
                
                {Object.keys(stats.topicBreakdown).length > 8 && (
                    <div className="topic-more">
                        +{Object.keys(stats.topicBreakdown).length - 8} more topics explored
                    </div>
                )}
            </div>
        );
    };

    const renderFiltersAndSort = () => {
        return (
            <div className="controls-section">
                <div className="controls-header">
                    <h4>Filter & Sort Your Challenges</h4>
                </div>
                <div className="controls-grid">
                    <div className="control-group">
                        <label htmlFor="filter-select">Show:</label>
                        <select
                            id="filter-select"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="modern-select"
                        >
                            <option value="all">All Challenges</option>
                            <option value="interview">Interview MCQs Only</option>
                            <option value="scenario">Scenario Challenges Only</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label htmlFor="sort-select">Sort by:</label>
                        <select
                            id="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="modern-select"
                        >
                            <option value="date">Date (Newest First)</option>
                            <option value="difficulty">Difficulty Level</option>
                            <option value="topic">Topic Name</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderChallengeCard = (challenge) => {
        const isInterview = challenge.type === "interview";
        
        return (
            <div
                key={challenge.id}
                className="challenge-card modern"
                onClick={() => openChallengeModal(challenge)}
            >
                <div className="challenge-type-badge">
                    {isInterview ? 'Interview' : 'Scenario'}
                </div>
                
                <div className="challenge-main-content">
                    <h5 className="challenge-title">{challenge.title}</h5>
                    
                    <div className="challenge-meta">
                        <div className="meta-item">
                            <span className="meta-icon">📝</span>
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
                            <span>Multiple choice • {JSON.parse(challenge.options || '[]').length} options</span>
                        ) : (
                            <span>Open-ended scenario • {JSON.parse(challenge.questions || '[]').length} questions</span>
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
                                        {JSON.parse(selectedChallenge.options || '[]').map((option, index) => (
                                            <div 
                                                key={index} 
                                                className={`option-item ${index === selectedChallenge.correct_answer_id ? 'correct' : ''}`}
                                            >
                                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                                <span className="option-text">{option}</span>
                                                {index === selectedChallenge.correct_answer_id && (
                                                    <span className="correct-indicator">✓ Correct</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
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
                                        <h4>Questions</h4>
                                        <div className="questions-list">
                                            {JSON.parse(selectedChallenge.questions || '[]').map((question, index) => (
                                                <div key={index} className="question-item">
                                                    <span className="question-number">{index + 1}.</span>
                                                    <span className="question-text">
                                                        {typeof question === 'string' ? question : question.prompt || question}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedChallenge.correct_answer && (
                                    <div className="correct-answer-section">
                                        <h4>Ideal Answer</h4>
                                        <div className="answer-content">
                                            <p>{selectedChallenge.correct_answer}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedChallenge.explanation && (
                                    <div className="explanation-section">
                                        <h4>Explanation & Guidance</h4>
                                        <div className="explanation-content">
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
                        <div className="error-icon">⚠️</div>
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
            </div>
            
            {renderStatsCard()}
            
            <div className="history-layout">
                <div className="history-main">
                    {renderFiltersAndSort()}
                    
                    {filteredHistory.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
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
                    {renderTopicBreakdown()}
                </div>
            </div>
            
            {renderChallengeModal()}
    </div>
  );
}
