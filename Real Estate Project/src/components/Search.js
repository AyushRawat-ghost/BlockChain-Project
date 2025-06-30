import React from 'react';

export default function Search({ searchQuery, onSearch }) {
  return (
    <div className="p-6 bg-white shadow-sm">
      <input
        type="text"
        value={searchQuery}
        onChange={e => onSearch(e.target.value)}
        placeholder="🔍 Search by ID, title or address…"
        className="w-full p-2 border rounded focus:outline-none focus:ring"
      />
    </div>
  );
}