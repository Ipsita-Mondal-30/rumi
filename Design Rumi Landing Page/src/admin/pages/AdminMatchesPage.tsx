import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminListMatches, adminDeleteMatch } from '../../services/adminApi';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type MatchRow = {
  _id: string;
  compatibilityScore: number | null;
  user1?: { name?: string; email?: string };
  user2?: { name?: string; email?: string };
  roomId?: { location?: { city?: string }; monthlyRent?: number } | null;
};

export function AdminMatchesPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminListMatches({ page, limit: 15 });
      if (data?.success) {
        setRows(data.matches || []);
        setPages(data.pagination?.pages ?? 1);
      }
    } catch {
      toast.error('Failed to load matches.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmRemove = async () => {
    if (!removeId) return;
    try {
      await adminDeleteMatch(removeId);
      toast.success('Match removed.');
      setRemoveId(null);
      void load();
    } catch {
      toast.error('Remove failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Matches</h1>
        <p className="text-sm text-slate-500 mt-1">Accepted connection requests (explore + listing)</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User A</TableHead>
                <TableHead>User B</TableHead>
                <TableHead>Room context</TableHead>
                <TableHead>Compatibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m._id}>
                  <TableCell className="text-sm">
                    <div className="font-medium">{m.user1?.name || '—'}</div>
                    <div className="text-slate-500 text-xs">{m.user1?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{m.user2?.name || '—'}</div>
                    <div className="text-slate-500 text-xs">{m.user2?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {m.roomId
                      ? `${m.roomId.location?.city || 'Room'} · ₹${m.roomId.monthlyRent ?? 0}`
                      : 'Direct / explore'}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {m.compatibilityScore != null ? `${m.compatibilityScore}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setRemoveId(m._id)} title="Remove match">
                      <Trash2 className="w-4 h-4 text-red-600" />
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

      <AlertDialog open={Boolean(removeId)} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this match?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the underlying accepted request. Users may need to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void confirmRemove()}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
