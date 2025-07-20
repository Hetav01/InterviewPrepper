import React from "react";

export default function HistorySearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="history-search-bar-row">
      <input
        type="text"
        className="history-search-input"
        placeholder="Search questions or topics..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        maxLength={100}
      />
    </div>
  );
} 