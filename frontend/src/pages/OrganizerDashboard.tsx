import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { Plus, Users, DollarSign, Ticket, Calendar, Download, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ConfirmDialog, EmptyState, Modal } from '../components/Shared';

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

export default function OrganizerDashboard() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [attendeesEventId, setAttendeesEventId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['organizer-dashboard'],
    queryFn: async () => (await api.get('/organizer/dashboard')).data.data,
  });

  const { data: events } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => (await api.get('/events/organizer/mine')).data.data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/events/categories/all')).data.data,
  });
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => (await api.get('/events/cities/all')).data.data,
  });

  const { data: attendees } = useQuery({
    queryKey: ['attendees', attendeesEventId],
    queryFn: async () => (await api.get(`/organizer/events/${attendeesEventId}/attendees`)).data.data,
    enabled: !!attendeesEventId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      setDeleteId(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/events/${id}/publish`),
    onSuccess: () => {
      toast.success('Event published');
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    },
  });

  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', cityId: '', venue: '',
    startDate: '', endDate: '', isFree: false, bannerUrl: '',
    ticketTypes: [{ name: 'Regular', price: 0, quota: 100 }],
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/events', form),
    onSuccess: () => {
      toast.success('Event created as draft');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create event'),
  });

  function exportCsv(eventId: string) {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/organizer/events/${eventId}/attendees/export`, '_blank');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Organizer Dashboard</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Create Event</button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} />
        <StatCard icon={Ticket} label="Tickets Sold" value={stats?.totalTicketsSold || 0} />
        <StatCard icon={Users} label="Total Orders" value={stats?.totalOrders || 0} />
        <StatCard icon={Calendar} label="Total Events" value={stats?.totalEvents || 0} />
      </div>

      {stats?.revenueChart?.length > 0 && (
        <div className="card mb-8 p-6">
          <h3 className="mb-4 font-bold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#f13a1f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h2 className="mb-4 text-xl font-bold">My Events</h2>
      {events?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Category</th>
                <th className="p-3">City</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e: any) => (
                <tr key={e.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3 font-medium">{e.title}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="p-3">{e.category?.name}</td>
                  <td className="p-3">{e.city?.name}</td>
                  <td className="p-3">{e._count?.orders ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {e.status === 'DRAFT' && (
                        <button onClick={() => publishMutation.mutate(e.id)} className="btn-secondary !px-2 !py-1 text-xs">Publish</button>
                      )}
                      <button onClick={() => setAttendeesEventId(e.id)} className="btn-secondary !px-2 !py-1 text-xs">Attendees</button>
                      <button onClick={() => exportCsv(e.id)} className="btn-secondary !px-2 !py-1 text-xs"><Download className="h-3 w-3" /></button>
                      <button onClick={() => setDeleteId(e.id)} className="btn-secondary !px-2 !py-1 text-xs !text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No events yet" message="Create your first event to start selling tickets." actionLabel="Create Event" onAction={() => setShowCreate(true)} />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <div className="space-y-3">
          <input placeholder="Event title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Category</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">City</option>
              {cities?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input placeholder="Venue" className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input type="datetime-local" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <input placeholder="Banner image URL" className="input" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Ticket price"
              className="input"
              value={form.ticketTypes[0].price}
              onChange={(e) => setForm({ ...form, ticketTypes: [{ ...form.ticketTypes[0], price: Number(e.target.value) }] })}
            />
            <input
              type="number"
              placeholder="Quota"
              className="input"
              value={form.ticketTypes[0].quota}
              onChange={(e) => setForm({ ...form, ticketTypes: [{ ...form.ticketTypes[0], quota: Number(e.target.value) }] })}
            />
          </div>
          <button onClick={() => createMutation.mutate()} className="btn-primary w-full">Create Event</button>
        </div>
      </Modal>

      <Modal open={!!attendeesEventId} onClose={() => setAttendeesEventId(null)} title="Attendee List">
        {attendees?.length ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((a: any, i: number) => (
              <div key={i} className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-sm">
                <p className="font-semibold">{a.name}</p>
                <p className="text-neutral-500">{a.email} — {a.tickets}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No paid attendees yet.</p>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete event?"
        message="This action cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
