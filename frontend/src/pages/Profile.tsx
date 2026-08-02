import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Gift, Bell, Copy } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { data: points } = useQuery({
    queryKey: ['my-points'],
    queryFn: async () => (await api.get('/profile/points')).data.data,
  });

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => (await api.get('/notifications/me')).data.data,
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put('/profile', { fullName, phone, address }),
    onSuccess: () => {
      toast.success('Profile updated');
      refetchUser();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Avatar updated');
      queryClient.invalidateQueries();
    },
    onError: () => toast.error('Failed to upload avatar'),
  });

  function copyReferral() {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`);
    toast.success('Referral link copied!');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">My Profile</h1>

      <div className="mb-8 card p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-2xl font-bold">
              {user?.fullName?.[0]}
            </div>
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-brand-500 p-1.5 text-white">
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])}
              />
            </label>
          </div>
          <div>
            <p className="font-bold">{user?.fullName}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-600">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+62..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </div>
          <button onClick={() => updateMutation.mutate()} className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="mb-8 card p-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><Gift className="h-5 w-5 text-brand-500" /> Referral & Points</h3>
        <p className="mb-2 text-sm text-neutral-500">Your referral code</p>
        <div className="mb-4 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm">{user?.referralCode}</code>
          <button onClick={copyReferral} className="btn-secondary !px-3 !py-2"><Copy className="h-4 w-4" /></button>
        </div>
        <p className="text-sm">Points balance: <span className="font-bold text-brand-500">{(points?.balance ?? 0).toLocaleString()}</span></p>
        {points?.coupons?.length > 0 && (
          <div className="mt-3 space-y-1">
            {points.coupons.map((c: any) => (
              <p key={c.id} className="text-xs text-neutral-500">Coupon: <code>{c.code}</code> — {c.discountValue}% off</p>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><Bell className="h-5 w-5 text-brand-500" /> Notifications</h3>
        {notifications?.length ? (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className={`rounded-lg p-3 text-sm ${n.isRead ? 'bg-neutral-50 dark:bg-neutral-800' : 'bg-brand-50 dark:bg-brand-500/10'}`}>
                <p className="font-semibold">{n.title}</p>
                <p className="text-neutral-500">{n.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
