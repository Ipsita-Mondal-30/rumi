import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminListRooms, adminModerateRoom, adminDeleteRoom } from '../../services/adminApi';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type RoomRow = {
  _id: string;
  ownerName?: string;
  city?: string;
  rent?: number;
  availability?: string;
  moderationStatus?: string;
  status?: string;
};

export function AdminRoomsPage() {
  const [rows, setRows] = useState<RoomRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cityDraft, setCityDraft] = useState('');
  const [city, setCity] = useState('');
  const [modFilter, setModFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminListRooms({
        page,
        limit: 15,
        city: city || undefined,
        moderationStatus: modFilter || undefined,
      });
      if (data?.success) {
        setRows(data.rooms || []);
        setPages(data.pagination?.pages ?? 1);
      }
    } catch {
      toast.error('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  }, [page, city, modFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (id: string, moderationStatus: 'approved' | 'rejected') => {
    try {
      await adminModerateRoom(id, moderationStatus);
      toast.success(moderationStatus === 'approved' ? 'Listing approved.' : 'Listing rejected.');
      void load();
    } catch {
      toast.error('Update failed.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteRoom(deleteId);
      toast.success('Room deleted.');
      setDeleteId(null);
      void load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Room listings</h1>
        <p className="text-sm text-slate-500 mt-1">Approve, reject, or remove listings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-xs text-slate-500 font-medium">City</label>
          <Input
            value={cityDraft}
            onChange={(e) => setCityDraft(e.target.value)}
            placeholder="Filter city"
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-xs text-slate-500 font-medium">Moderation</label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setCity(cityDraft);
            setPage(1);
          }}
        >
          Apply
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Moderation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.ownerName}</TableCell>
                  <TableCell className="text-sm">{r.city}</TableCell>
                  <TableCell className="text-sm">₹{r.rent ?? 0}</TableCell>
                  <TableCell className="text-sm text-slate-600">{r.availability}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {r.moderationStatus || 'approved'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => void moderate(r._id, 'approved')}
                        title="Approve"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => void moderate(r._id, 'rejected')}
                        title="Reject"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setDeleteId(r._id)}>
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

      <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>Room-scoped requests will be removed. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
