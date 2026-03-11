import React, { useState } from 'react';

const GENDERS = ['Any', 'Male', 'Female', 'Non-binary'];
const FOOD = ['Any', 'Veg', 'Non-veg', 'Egg'];
const SLEEP = ['Any', 'Early sleeper', 'Night owl'];
const SMOKING = ['Any', 'Yes', 'No'];
const PETS = ['Any', 'Yes', 'No'];

export function FilterPanel({ filters, onChange, onClose }) {
  const [local, setLocal] = useState(filters || {});

  const update = (key, value) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange?.(next);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 max-w-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Filters</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
          <select
            value={local.gender ?? 'Any'}
            onChange={(e) => update('gender', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
          <input
            type="text"
            placeholder="e.g. Delhi"
            value={local.city ?? ''}
            onChange={(e) => update('city', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Budget (₹/mo)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={local.budgetMin ?? ''}
              onChange={(e) => update('budgetMin', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={local.budgetMax ?? ''}
              onChange={(e) => update('budgetMax', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Food</label>
          <select
            value={local.foodPreference ?? 'Any'}
            onChange={(e) => update('foodPreference', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
          >
            {FOOD.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sleep</label>
          <select
            value={local.sleepSchedule ?? 'Any'}
            onChange={(e) => update('sleepSchedule', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
          >
            {SLEEP.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Smoking</label>
          <select
            value={local.smoking ?? 'Any'}
            onChange={(e) => update('smoking', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
          >
            {SMOKING.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Pets</label>
          <select
            value={local.pets ?? 'Any'}
            onChange={(e) => update('pets', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
          >
            {PETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
