import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, TrendingUp, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { EventItem, Category } from '../types';
import EventCard from '../components/EventCard';
import { EventCardSkeleton, EmptyState } from '../components/Shared';
import PromoMarquee from "../components/PromoMarquee";

function useEvents(params: Record<string, string>) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const { data } = await api.get('/events', { params });
      return data.data as EventItem[];
    },
  });
}

export default function Landing() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/events/categories/all')).data.data as Category[],
  });

  const { data: popular, isLoading: loadingPopular } = useEvents({ sort: 'popular', limit: '8' });
  const { data: upcoming, isLoading: loadingUpcoming } = useEvents({ sort: 'newest', limit: '4' });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/events?search=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      {/* Parallax Hero */}
      <section 
        className="relative py-24 overflow-hidden text-white bg-center bg-cover"
        style={{
          backgroundImage: 'url(/images/hero_banner.png)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay untuk kontras teks */}
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          className="absolute rounded-full -left-20 -top-20 h-72 w-72 bg-white/10 blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute bottom-0 rounded-full -right-10 h-96 w-96 bg-white/10 blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
        <div className="relative max-w-4xl px-4 mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-4xl font-extrabold leading-tight sm:text-6xl"
          >
            Find your next unforgettable experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-lg text-white/90"
          >
            Concerts, conferences, workshops, and more — all in one place.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearch}
            className="flex items-center max-w-xl gap-2 p-2 mx-auto bg-white shadow-xl rounded-2xl"
          >
            <Search className="w-5 h-5 ml-2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for events, cities, categories..."
              className="flex-1 px-2 py-2 bg-transparent outline-none text-neutral-900"
            />
            <button type="submit" className="btn-primary !rounded-xl">
              Search
            </button>
          </motion.form>
        </div>
      </section>
      <PromoMarquee/>

      {/* Categories */}
      <section className="px-4 py-12 mx-auto max-w-7xl lg:px-8">
        <div className="flex flex-wrap justify-center gap-3">
          {categories?.map((c) => (
            <Link
              key={c.id}
              to={`/events?category=${c.slug}`}
              className="px-4 py-2 text-sm font-medium transition-colors border rounded-full border-neutral-200 dark:border-neutral-800 hover:border-brand-500 hover:text-brand-500"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Events */}
      <section className="px-4 py-8 mx-auto max-w-7xl lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          <h2 className="text-2xl font-bold">Popular Events</h2>
        </div>
        {loadingPopular ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : popular?.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        ) : (
          <EmptyState title="No events yet" message="Check back soon for exciting events." />
        )}
      </section>

      {/* Upcoming Events */}
      <section className="px-4 py-8 mx-auto max-w-7xl lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <CalendarClock className="w-5 h-5 text-brand-500" />
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
        </div>
        {loadingUpcoming ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : upcoming?.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* CTA for organizers */}
      <section className="px-4 py-16 mx-auto max-w-7xl lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 p-10 text-white glass rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-700 sm:flex-row">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-300" />
            <div>
              <h3 className="text-xl font-bold">Have an event to host?</h3>
              <p className="text-sm text-white/70">Create and sell tickets in minutes.</p>
            </div>
          </div>
          <Link to="/register" className="btn-primary whitespace-nowrap">
            Start Organizing
          </Link>
        </div>
      </section>
    </div>
  );
}
