import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import EventCard from '../components/EventCard';
import { EventCardSkeleton, EmptyState } from '../components/Shared';

export default function Wishlist() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['my-wishlist'],
    queryFn: async () => (await api.get('/wishlist/me')).data.data,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold">My Wishlist</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : data?.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((w: any, i: number) => <EventCard key={w.id} event={w.event} index={i} />)}
        </div>
      ) : (
        <EmptyState title="Your wishlist is empty" message="Save events you're interested in to find them here later." actionLabel="Explore Events" onAction={() => navigate('/events')} />
      )}
    </div>
  );
}
