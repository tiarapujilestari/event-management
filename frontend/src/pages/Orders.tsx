import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Download, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { EmptyState, Modal } from '../components/Shared';
import { useNavigate } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
  EXPIRED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
};

export default function Orders() {
  const navigate = useNavigate();
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/me')).data.data,
  });

  async function submitReview() {
    try {
      await api.post('/reviews', { orderId: reviewOrder.id, rating, comment });
      toast.success('Review submitted!');
      setReviewOrder(null);
      setComment('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  }

  function downloadInvoice(order: any) {
    const content = `INVOICE\n\nInvoice Number: ${order.invoiceNumber}\nEvent: ${order.event?.title}\nDate: ${dayjs(order.createdAt).format('DD MMM YYYY')}\nSubtotal: ${formatCurrency(order.subtotal)}\nDiscount: ${formatCurrency(order.discountTotal)}\nTotal: ${formatCurrency(order.total)}\nStatus: ${order.status}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-neutral-400">Loading orders...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">My Tickets</h1>

      {orders?.length ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{order.event?.title}</p>
                  <p className="text-xs text-neutral-500">Invoice: {order.invoiceNumber}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {order.items?.map((item: any) => (
                  <p key={item.id}>{item.ticketType?.name} x{item.quantity} — {formatCurrency(Number(item.price) * item.quantity)}</p>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <p className="font-bold">{formatCurrency(order.total)}</p>
                <div className="flex gap-2">
                  {order.status === 'PAID' && (
                    <>
                      <button onClick={() => downloadInvoice(order)} className="btn-secondary !px-3 !py-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" /> Invoice
                      </button>
                      {!order.review && (
                        <button onClick={() => setReviewOrder(order)} className="btn-secondary !px-3 !py-1.5 text-xs">
                          <Star className="h-3.5 w-3.5" /> Review
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'PENDING' && order.payment?.paymentUrl && (
                    <a href={order.payment.paymentUrl} className="btn-primary !px-3 !py-1.5 text-xs">
                      Pay Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No orders yet" message="Book your first event to see it here." actionLabel="Explore Events" onAction={() => navigate('/events')} />
      )}

      <Modal open={!!reviewOrder} onClose={() => setReviewOrder(null)} title="Rate this event">
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="input mb-4 min-h-[100px]"
        />
        <button onClick={submitReview} className="btn-primary w-full">Submit Review</button>
      </Modal>
    </div>
  );
}
