import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera, Gift, Bell, Copy, KeyRound, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      // IMPORTANT: don't manually set Content-Type here — the browser/axios
      // needs to auto-generate it (including the multipart boundary).
      // Manually forcing 'multipart/form-data' without a boundary breaks upload parsing.
      return api.post('/profile/avatar', formData);
    },
    onSuccess: () => {
      toast.success('Avatar updated');
      queryClient.invalidateQueries();
      refetchUser();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to upload avatar'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => api.put('/profile/change-password', { currentPassword, newPassword }),
    onSuccess: async () => {
      toast.success('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await logout();
      navigate('/login');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  function copyReferral() {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`);
    toast.success('Referral link copied!');
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    changePasswordMutation.mutate();
  }

  return (
    <div className="max-w-3xl px-4 py-10 mx-auto">
      <h1 className="mb-6 text-2xl font-extrabold">My Profile</h1>

      <div className="p-6 mb-8 card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {user?.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt={user.fullName}
                className="object-cover w-20 h-20 rounded-full"
              />
            ) : (
              <div className="flex items-center justify-center w-20 h-20 text-2xl font-bold rounded-full bg-neutral-200 dark:bg-neutral-800">
                {user?.fullName?.[0]}
              </div>
            )}
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-brand-500 p-1.5 text-white">
              {avatarMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={avatarMutation.isPending}
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
            <label className="block mb-1 text-sm font-medium">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+62..." />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </div>
          <button onClick={() => updateMutation.mutate()} className="btn-primary">Save Changes</button>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-6 mb-8 card">
        <h3 className="flex items-center gap-2 mb-4 font-bold">
          <KeyRound className="w-5 h-5 text-brand-500" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters, 1 uppercase, 1 number"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
            {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
          <p className="text-xs text-neutral-400">
            For security, you'll be logged out of all devices after changing your password.
          </p>
        </form>
      </div>

      <div className="p-6 mb-8 card">
        <h3 className="flex items-center gap-2 mb-3 font-bold"><Gift className="w-5 h-5 text-brand-500" /> Referral & Points</h3>
        <p className="mb-2 text-sm text-neutral-500">Your referral code</p>
        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800">{user?.referralCode}</code>
          <button onClick={copyReferral} className="btn-secondary !px-3 !py-2"><Copy className="w-4 h-4" /></button>
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

      <div className="p-6 card">
        <h3 className="flex items-center gap-2 mb-3 font-bold"><Bell className="w-5 h-5 text-brand-500" /> Notifications</h3>
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
