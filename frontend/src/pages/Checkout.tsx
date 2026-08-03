import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Ticket, Tag, Coins, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface LocationState {
  eventId: string;
  eventTitle: string;
  items: { ticketTypeId: string; quantity: number }[];
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = location.state as LocationState | undefined;

  const [voucherCode, setVoucherCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);

  const { data: pointsData } = useQuery({
    queryKey: ['my-points'],
    queryFn: async () => (await api.get('/profile/points')).data.data,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/orders/checkout', {
        eventId: state?.eventId,
        items: state?.items,
        voucherCode: voucherCode || undefined,
        couponCode: couponCode || undefined,
        pointsToUse: usePoints ? pointsData?.balance || 0 : 0,
      });
      return data.data;
    },
    onSuccess: () => {
      // No payment gateway anymore — the order just sits as PENDING until
      // the customer uploads their transfer proof from the My Tickets page.
      // Invalidate the cached orders list so it doesn't show a stale
      // (possibly empty) result when we navigate there.
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Order placed! Please complete your payment from My Tickets.');
      navigate('/orders');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Checkout failed'),
  });

  if (!state) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-neutral-500">No items to checkout. Please select tickets from an event page first.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/events')}>Browse Events</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold">
          <Ticket className="h-6 w-6 text-brand-500" /> Checkout
        </h1>

        <div className="mb-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
          <p className="font-semibold">{state.eventTitle}</p>
          <p className="text-sm text-neutral-500">{state.items.reduce((s, i) => s + i.quantity, 0)} ticket(s) selected</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4" /> Voucher Code</label>
          <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Enter voucher code" className="input" />
        </div>

        <div className="mb-4">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4" /> Referral Coupon</label>
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="input" />
        </div>

        {pointsData?.balance > 0 && (
          <label className="mb-6 flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-sm">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            <Coins className="h-4 w-4 text-amber-500" />
            Use my points balance ({pointsData.balance.toLocaleString()} pts)
          </label>
        )}

        <button
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
          className="btn-primary w-full"
        >
          {checkoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Place Order
        </button>

        <p className="mt-3 text-center text-xs text-neutral-400">
          You'll be able to upload your bank transfer proof from the My Tickets page.
        </p>
      </motion.div>
    </div>
  );
}
