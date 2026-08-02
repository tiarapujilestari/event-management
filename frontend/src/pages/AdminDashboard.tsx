import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, Calendar, DollarSign, Receipt, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ConfirmDialog } from '../components/Shared';

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" /> <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}

type Tab = 'users' | 'events' | 'transactions';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data.data,
    enabled: tab === 'users',
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => (await api.get('/admin/events')).data.data,
    enabled: tab === 'events',
  });

  const { data: transactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => (await api.get('/admin/transactions')).data.data,
    enabled: tab === 'transactions',
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUserId(null);
    },
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/admin/events/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Event status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Customers" value={stats?.totalUsers || 0} />
        <StatCard icon={Users} label="Organizers" value={stats?.totalOrganizers || 0} />
        <StatCard icon={Calendar} label="Total Events" value={stats?.totalEvents || 0} />
        <StatCard icon={DollarSign} label="Platform Revenue" value={formatCurrency(stats?.totalRevenue || 0)} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-neutral-100 dark:border-neutral-800">
        {(['users', 'events', 'transactions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-brand-500 text-brand-500' : 'text-neutral-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Verified</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3 font-medium">{u.fullName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.isVerified ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <button onClick={() => setDeleteUserId(u.id)} className="btn-secondary !px-2 !py-1 text-xs !text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'events' && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
              <tr><th className="p-3">Title</th><th className="p-3">Organizer</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {events?.map((e: any) => (
                <tr key={e.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3 font-medium">{e.title}</td>
                  <td className="p-3">{e.organizer?.fullName}</td>
                  <td className="p-3">{e.status}</td>
                  <td className="p-3">
                    {e.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateEventStatusMutation.mutate({ id: e.id, status: 'CANCELLED' })}
                        className="btn-secondary !px-2 !py-1 text-xs !text-red-500"
                      >
                        Cancel Event
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
              <tr><th className="p-3"><Receipt className="inline h-3.5 w-3.5" /> Invoice</th><th className="p-3">User</th><th className="p-3">Event</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {transactions?.map((t: any) => (
                <tr key={t.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3">{t.invoiceNumber}</td>
                  <td className="p-3">{t.user?.fullName}</td>
                  <td className="p-3">{t.event?.title}</td>
                  <td className="p-3">{formatCurrency(t.total)}</td>
                  <td className="p-3">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteUserId}
        title="Delete user?"
        message="This will permanently remove the user account."
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
      />
    </div>
  );
}
