import React from "react";
import AnimatedNumber from "./AnimatedNumber";

export default function HistoryStatsCard({ stats, todaysCount }) {
    if (!stats) return null;
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
} 