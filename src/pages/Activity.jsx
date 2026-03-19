import React from 'react';

export function Activity() {
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Activity & Stats</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Connections sent</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Matches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Avg. match score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">—</p>
        </div>
      </div>
      <p className="mt-6 text-gray-500 text-sm">Detailed stats coming soon.</p>
    </div>
  );
}
