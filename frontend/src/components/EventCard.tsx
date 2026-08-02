import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { EventItem } from '../types';
import { formatCurrency } from '../lib/utils';

export default function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  const price = event.isFree ? 'Free' : formatCurrency(event.minPrice ?? event.ticketTypes?.[0]?.price ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link to={`/events/${event.slug}`} className="card group block overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={event.bannerUrl || 'https://placehold.co/600x450/f5f5f5/a3a3a3?text=No+Image'}
            alt={event.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/600x450/f5f5f5/a3a3a3?text=No+Image';
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 dark:bg-neutral-900/90 px-3 py-1 text-xs font-semibold shadow">
            {event.category?.name}
          </span>
        </div>
        <div className="p-4">
          <p className="mb-1 flex items-center gap-1 text-xs text-neutral-500">
            <Calendar className="h-3 w-3" /> {dayjs(event.startDate).format('ddd, D MMM YYYY')}
          </p>
          <h3 className="mb-1 line-clamp-2 font-bold leading-snug">{event.title}</h3>
          <p className="mb-3 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3 w-3" /> {event.venue}, {event.city?.name}
          </p>
          <p className="font-bold text-brand-500">{price}</p>
        </div>
      </Link>
    </motion.div>
  );
}
