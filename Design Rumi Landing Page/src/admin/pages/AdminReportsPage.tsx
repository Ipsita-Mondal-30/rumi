import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { adminListReports, adminHandleReport } from '../../services/adminApi';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

type ReportRow = {
  _id: string;
  reason?: string;
  status?: string;
  description?: string;
  reporterId?: { name?: string; email?: string };
  reportedUserId?: { name?: string; email?: string; accountStatus?: string };
};

export function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');

  const [actionReport, setActionReport] = useState<ReportRow | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminListReports({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      if (data?.success) {
        setRows(data.reports || []);
        setPages(data.pagination?.pages ?? 1);
      }
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: 'warn' | 'block' | 'delete' | 'dismiss') => {
    if (!actionReport) return;
    try {
      await adminHandleReport(actionReport._id, { action, note: note.trim() || undefined });
      toast.success('Report updated.');
      setActionReport(null);
      setNote('');
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Review flags and take moderation action</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 font-medium">Status</label>
          <select
            className="mt-1 w-40 h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="open">open</option>
            <option value="resolved">resolved</option>
            <option value="dismissed">dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="text-sm">
                    {r.reporterId?.name}
                    <div className="text-xs text-slate-500">{r.reporterId?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.reportedUserId?.name || '—'}
                    <div className="text-xs text-slate-500">{r.reportedUserId?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{r.reason?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100">{r.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={r.status !== 'open'}
                      onClick={() => {
                        setNote('');
                        setActionReport(r);
                      }}
                    >
                      Handle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(actionReport)} onOpenChange={() => setActionReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handle report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Reported: <strong>{actionReport?.reportedUserId?.name}</strong> ({actionReport?.reportedUserId?.email})
            </p>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => void runAction('dismiss')}>
              Dismiss
            </Button>
            <Button variant="secondary" onClick={() => void runAction('warn')}>
              Warn user
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => void runAction('block')}>
              Block user
            </Button>
            <Button variant="destructive" onClick={() => void runAction('delete')}>
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
