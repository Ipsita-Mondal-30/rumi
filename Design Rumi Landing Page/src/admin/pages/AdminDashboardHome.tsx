import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Home, HeartHandshake, Flag, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { adminOverview } from '../../services/adminApi';
import { toast } from 'sonner';

type Stats = {
  totalUsers: number;
  activeUsers: number;
  roomsListed: number;
  matchesMade: number;
  pendingReports: number;
  pendingRooms: number;
};

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          {sub ? <p className="text-xs text-slate-400 mt-1">{sub}</p> : null}
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/** Overview metrics + 7-day signup trend chart. */
export function AdminDashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<{ date: string; signups: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await adminOverview();
        if (cancelled) return;
        if (data?.success) {
          setStats(data.stats);
          setTrend(data.signupTrend || []);
        } else {
          toast.error('Could not load overview.');
        }
      } catch {
        if (!cancelled) toast.error('Could not load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Key metrics for the Rumi platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Total users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard
          title="Active users"
          value={stats?.activeUsers ?? 0}
          icon={UserCheck}
          sub="Updated profile in last 30 days"
        />
        <StatCard title="Rooms listed" value={stats?.roomsListed ?? 0} icon={Home} sub="Non-rejected listings" />
        <StatCard title="Matches made" value={stats?.matchesMade ?? 0} icon={HeartHandshake} sub="Accepted requests" />
        <StatCard title="Open reports" value={stats?.pendingReports ?? 0} icon={Flag} />
        <StatCard title="Pending room review" value={stats?.pendingRooms ?? 0} icon={Clock} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">New signups (7 days)</h2>
        <p className="text-sm text-slate-500 mb-6">UTC dates</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="signups" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
