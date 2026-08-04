import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Star, Heart, Users, Minus, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { EmptyState } from '../components/Shared';

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState(0);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: async () => (await api.get(`/events/${slug}`)).data.data,
    enabled: !!slug,
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => (await api.post(`/wishlist/${event.id}`)).data,
    onSuccess: () => {
      toast.success('Wishlist updated');
      queryClient.invalidateQueries({ queryKey: ['event', slug] });
    },
    onError: () => toast.error('Please log in to add to wishlist'),
  });

  if (isLoading) {
    return <div className="max-w-6xl px-4 py-20 mx-auto text-center text-neutral-400">Loading event...</div>;
  }
  if (!event) {
    return <EmptyState title="Event not found" message="This event may have been removed." />;
  }

  const images = event.images?.length ? event.images : [{ imageUrl: event.bannerUrl }];
  const totalPrice = Object.entries(selectedTickets).reduce((sum, [id, qty]) => {
    const t = event.ticketTypes.find((t: any) => t.id === id);
    return sum + (t ? Number(t.price) * qty : 0);
  }, 0);
  const totalQty = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  function updateQty(ticketId: string, delta: number, max: number) {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketId]: next };
    });
  }

  function handleBuy() {
    if (!user) {
      toast.error('Please log in to buy tickets');
      navigate('/login', { state: { from: `/events/${slug}` } });
      return;
    }
    if (totalQty === 0) {
      toast.error('Select at least one ticket');
      return;
    }
    navigate('/checkout', {
      state: {
        eventId: event.id,
        eventTitle: event.title,
        items: Object.entries(selectedTickets)
          .filter(([, qty]) => qty > 0)
          .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })),
      },
    });
  }

  return (
    <div className="max-w-6xl px-4 py-10 mx-auto lg:px-8">
      {/* Gallery */}
      <div className="mb-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
          <motion.img
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={images[activeImage]?.imageUrl}
            alt={event.title}
            className="max-h-[32rem] w-full object-contain"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {images.map((img: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === i ? "border-brand-500" : "border-transparent"}`}
              >
                <img
                  src={img.imageUrl}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600">
            {event.category?.name}
          </span>
          <h1 className="mb-3 text-3xl font-extrabold">{event.title}</h1>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />{" "}
              {dayjs(event.startDate).format("dddd, D MMMM YYYY, HH:mm")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {event.venue}, {event.city?.name}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400" />{" "}
              {event.avgRating || "No ratings"} ({event.reviews?.length || 0}{" "}
              reviews)
            </span>
          </div>

          <button
            onClick={() => wishlistMutation.mutate()}
            className="mb-8 btn-secondary"
          >
            <Heart className="w-4 h-4" /> Save to Wishlist (
            {event._count?.wishlistedBy ?? 0})
          </button>

          <section className="mb-10">
            <h2 className="mb-3 text-xl font-bold">About this event</h2>
            <p className="leading-relaxed whitespace-pre-line text-neutral-600 dark:text-neutral-300">
              {event.description}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-xl font-bold">Location</h2>
            <div className="overflow-hidden aspect-video rounded-2xl">
              <iframe
                title="map"
                width="100%"
                height="100%"
                loading="lazy"
                src={
                  event.latitude && event.longitude
                    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`
                    : `https://www.google.com/maps?q=${encodeURIComponent(
                        `${event.venue}, ${event.location}`,
                      )}&z=15&output=embed`
                }
              />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="flex items-center gap-2 mb-3 text-xl font-bold">
              <Users className="w-5 h-5" /> Organizer
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 font-bold rounded-full bg-neutral-200 dark:bg-neutral-800">
                {event.organizer?.fullName?.[0]}
              </div>
              <div>
                <p className="font-semibold">{event.organizer?.fullName}</p>
                <p className="text-sm text-neutral-500">Event Organizer</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold">Reviews</h2>
            {event.reviews?.length ? (
              <div className="space-y-4">
                {event.reviews.map((r: any) => (
                  <div key={r.id} className="p-4 card">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{r.user?.fullName}</p>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {r.comment}
                      </p>
                    )}
                    {r.reply && (
                      <div className="p-3 mt-2 text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800">
                        <span className="font-semibold">Organizer reply: </span>
                        {r.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No reviews yet.</p>
            )}
          </section>

          {event.relatedEvents?.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Related Events</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {event.relatedEvents.map((e: any, i: number) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky ticket selector */}
        <div className="h-fit lg:sticky lg:top-24">
          <div className="p-6 card">
            <h3 className="mb-4 font-bold">Select Tickets</h3>
            <div className="space-y-4">
              {event.ticketTypes.map((t: any) => {
                const remaining = t.quota - t.sold;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-brand-500">
                        {formatCurrency(t.price)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {remaining} left
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQty(
                            t.id,
                            -1,
                            Math.min(remaining, event.maxPurchase),
                          )
                        }
                        className="rounded-full border p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-sm text-center">
                        {selectedTickets[t.id] || 0}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(
                            t.id,
                            1,
                            Math.min(remaining, event.maxPurchase),
                          )
                        }
                        className="rounded-full border p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-lg font-bold">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <button onClick={handleBuy} className="w-full mt-4 btn-primary">
              Buy Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
