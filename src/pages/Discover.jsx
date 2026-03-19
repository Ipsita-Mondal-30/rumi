import React, { useState, useEffect } from 'react';
import { MatchCard } from '../components/MatchCard.jsx';
import { FilterPanel } from '../components/FilterPanel.jsx';
import { getMatches, sendRequest, passRequest } from '../services/api.js';
import { DEMO_DISCOVER } from '../data/mockData.js';
import { SlidersHorizontal } from 'lucide-react';

export function Discover() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [useDemoData, setUseDemoData] = useState(false);

  const fetchMatches = () => {
    setLoading(true);
    getMatches(filters)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
          setMatches(res.data.matches);
          setUseDemoData(false);
        } else {
          setUseDemoData(true);
          setMatches([...DEMO_DISCOVER]);
        }
      })
      .catch(() => {
        setUseDemoData(true);
        setMatches([...DEMO_DISCOVER]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const current = matches[0];
  const handleConnect = () => {
    if (!current?.user?._id) return;
    setSending(true);
    if (useDemoData) {
      setMatches((prev) => prev.slice(1));
      setSending(false);
      return;
    }
    sendRequest(current.user._id)
      .then(() => setMatches((prev) => prev.slice(1)))
      .finally(() => setSending(false));
  };
  const handleSkip = () => setMatches((prev) => prev.slice(1));
  const handleSkipApi = () => {
    if (useDemoData) return handleSkip();
    const current = matches[0];
    if (!current?.user?._id) return;
    setSending(true);
    passRequest(current.user._id)
      .finally(() => setSending(false))
      .then(fetchMatches);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full bg-[#F7F8FC]">
      <div className="flex-1 flex flex-col items-center min-w-0">
        <div className="flex items-center justify-between w-full max-w-md mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Discover Matches</h2>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white bg-white shadow-sm"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
        {loading ? (
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-md animate-pulse h-96 flex items-center justify-center">
            <p className="text-slate-500">Loading matches…</p>
          </div>
        ) : current ? (
          <MatchCard
            profile={current.user}
            matchScore={current.matchScore}
            reasons={current.reasons}
            onConnect={handleConnect}
            onSkip={handleSkipApi}
            loading={sending}
          />
        ) : (
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-md p-12 text-center">
            <p className="text-slate-500">No more profiles right now. Check back later!</p>
          </div>
        )}
      </div>
      {showFilters && (
        <div className="lg:w-80 flex-shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
        </div>
      )}
    </div>
  );
}
