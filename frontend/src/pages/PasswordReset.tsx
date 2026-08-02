import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <h1 className="mb-1 text-2xl font-extrabold">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-neutral-500">If that email exists, we've sent a reset link. Please check your inbox.</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-neutral-500">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="input" required />
              <button disabled={submitting} className="btn-primary w-full">Send reset link</button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link to="/login" className="font-semibold text-brand-500 hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <h1 className="mb-1 text-2xl font-extrabold">Set a new password</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="New password"
            className="input"
            required
          />
          <button disabled={submitting} className="btn-primary w-full">Reset password</button>
        </form>
      </motion.div>
    </div>
  );
}
