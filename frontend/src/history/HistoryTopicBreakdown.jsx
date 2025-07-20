import React, { useState } from "react";

export default function HistoryTopicBreakdown({ stats, setSearchQuery }) {
    const [visibleTopics, setVisibleTopics] = useState(8); // Default number of topics to show
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!stats || !stats.topicBreakdown) return null;

    const allTopics = Object.entries(stats.topicBreakdown)
        .sort(([,a], [,b]) => b - a);

    const displayedTopics = allTopics.slice(0, visibleTopics);
    const remainingTopics = allTopics.length - visibleTopics;
    const allTopicsShown = remainingTopics === 0;

    const handleTopicClick = (topic) => {
        setSearchQuery(topic);
    };

    const handleViewMore = () => {
        // Show 3 more topics
        setVisibleTopics(prev => Math.min(prev + 3, allTopics.length));
        setIsExpanded(true);
    };

    const handleViewAll = () => {
        if (allTopicsShown) {
            // Collapse back to default view
            setVisibleTopics(8);
            setIsExpanded(false);
        } else {
            // Show all topics
            setVisibleTopics(allTopics.length);
            setIsExpanded(true);
        }
    };

    return (
        <div className="topic-insights">
            <h4>Your Focus Areas</h4>
            <div className="topic-list">
                {displayedTopics.map(([topic, count]) => (
                    <div 
                        key={topic} 
                        className="topic-item clickable"
                        onClick={() => handleTopicClick(topic)}
                        title={`Click to filter by ${topic}`}
                    >
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
            
            {remainingTopics > 0 && (
                <div className="topic-actions">
                    <button 
                        className="topic-view-more-btn"
                        onClick={handleViewMore}
                    >
                        View {Math.min(3, remainingTopics)} More
                    </button>
                    {!isExpanded && remainingTopics > 3 && (
                        <button 
                            className="topic-view-all-btn"
                            onClick={handleViewAll}
                        >
                            View All ({remainingTopics})
                        </button>
                    )}
                </div>
            )}
            
            {allTopicsShown && (
                <div className="topic-actions">
                    <button 
                        className="topic-view-all-btn"
                        onClick={handleViewAll}
                    >
                        Collapse
                    </button>
                </div>
            )}
        </div>
    );
} 