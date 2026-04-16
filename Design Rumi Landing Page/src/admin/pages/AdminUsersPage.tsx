import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
} from '../../services/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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

type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  cityDisplay?: string;
  preferencesSummary?: string;
  accountStatus?: string;
};

/** Paginated user table with filters and moderation actions. */
export function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qDraft, setQDraft] = useState('');
  const [cityDraft, setCityDraft] = useState('');
  const [foodDraft, setFoodDraft] = useState('');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [food, setFood] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminListUsers({
        page,
        limit: 15,
        city: city || undefined,
        q: q || undefined,
        foodPreference: food || undefined,
      });
      if (data?.success) {
        setRows(data.users || []);
        setPages(data.pagination?.pages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, city, q, food]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const { data } = await adminGetUser(id);
      if (data?.success) {
        setDetailUser(data.user as Record<string, unknown>);
        setDetailOpen(true);
      }
    } catch {
      toast.error('Could not load user.');
    }
  };

  const toggleBlock = async (u: UserRow) => {
    const next = u.accountStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await adminUpdateUser(u._id, { accountStatus: next });
      toast.success(next === 'blocked' ? 'User blocked.' : 'User unblocked.');
      void load();
    } catch {
      toast.error('Update failed.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteUser(deleteId);
      toast.success('User deleted.');
      setDeleteId(null);
      void load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Search, filter, and moderate accounts</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Search name / email</label>
            <Input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Search…" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">City</label>
            <Input
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              placeholder="City"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Food preference</label>
            <select
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={foodDraft}
              onChange={(e) => setFoodDraft(e.target.value)}
            >
              <option value="">Any</option>
              <option value="veg">veg</option>
              <option value="non-veg">non-veg</option>
              <option value="egg">egg</option>
            </select>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setQ(qDraft);
            setCity(cityDraft);
            setFood(foodDraft);
            setPage(1);
          }}
        >
          Apply filters
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="max-w-[220px]">Preferences</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.name || '—'}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.cityDisplay}</TableCell>
                  <TableCell className="text-xs text-slate-500 truncate max-w-[220px]">
                    {u.preferencesSummary}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.accountStatus === 'blocked'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {u.accountStatus === 'blocked' ? 'blocked' : 'active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => void openDetail(u._id)} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void toggleBlock(u)} title="Block / Unblock">
                        {u.accountStatus === 'blocked' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Ban className="w-4 h-4 text-amber-600" />
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(u._id)} title="Delete">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
          <span>
            Page {page} of {pages} · {total} users
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>
          {detailUser ? (
            <pre className="text-xs bg-slate-50 rounded-lg p-4 overflow-x-auto text-slate-800">
              {JSON.stringify(detailUser, null, 2)}
            </pre>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the account and related rooms, requests, messages, and reports. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
