import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { User, Mail, Lock, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  role: z.enum(['CUSTOMER', 'ORGANIZER']),
  referralCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER', referralCode: searchParams.get('ref') || '' },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await registerUser(data);
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-8 card">
        <h1 className="mb-1 text-2xl font-extrabold">Create your account</h1>
        <p className="mb-6 text-sm text-neutral-500">Join Eventify to discover and host amazing events.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-neutral-400" />
              <input {...register('fullName')} placeholder="Full name" className="input pl-9" />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-neutral-400" />
              <input {...register('email')} placeholder="Email" className="input pl-9" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-neutral-400" />
              <input type="password" {...register('password')} placeholder="Password" className="input pl-9" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10">
              <input type="radio" value="CUSTOMER" {...register('role')} className="hidden" />
              Customer
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10">
              <input type="radio" value="ORGANIZER" {...register('role')} className="hidden" />
              Organizer
            </label>
          </div>

          <div>
            <div className="relative">
              <Gift className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-neutral-400" />
              <input {...register('referralCode')} placeholder="Referral code (optional)" className="input pl-9" />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full btn-primary">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-neutral-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-500 hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
