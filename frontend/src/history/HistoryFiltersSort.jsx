import React from "react";

export default function HistoryFiltersSort({ filter, setFilter, sortBy, setSortBy, children }) {
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
            {children}
        </div>
    );
} 