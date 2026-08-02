import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { EventItem, Category, City } from '../types';
import EventCard from '../components/EventCard';
import { EventCardSkeleton, EmptyState } from '../components/Shared';

function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category') || '';
  const city = searchParams.get('city') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      category,
      city,
      sort,
      minPrice,
      maxPrice,
      page: String(page),
      limit: '12',
    }),
    [debouncedSearch, category, city, sort, minPrice, maxPrice, page]
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/events/categories/all')).data.data as Category[],
  });
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => (await api.get('/events/cities/all')).data.data as City[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['events-list', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/events', { params: queryParams });
      return data as { data: EventItem[]; pagination: { totalPages: number; total: number } };
    },
  });

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Explore Events</h1>
          <p className="text-sm text-neutral-500">{data?.pagination.total ?? 0} events found</p>
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary md:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside className={`space-y-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events..."
              className="input"
            />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Category</h4>
            <div className="space-y-1">
              <button
                onClick={() => updateFilter('category', '')}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${!category ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                All Categories
              </button>
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilter('category', c.slug)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${category === c.slug ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">City</h4>
            <select value={city} onChange={(e) => updateFilter('city', e.target.value)} className="input">
              <option value="">All Cities</option>
              {cities?.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Price Range</h4>
            <div className="flex gap-2">
              <input
                value={minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                type="number"
                placeholder="Min"
                className="input"
              />
              <input
                value={maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                type="number"
                placeholder="Max"
                className="input"
              />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Sort By</h4>
            <select value={sort} onChange={(e) => updateFilter('sort', e.target.value)} className="input">
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_low">Lowest Price</option>
              <option value="price_high">Highest Price</option>
            </select>
          </div>
        </aside>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : data?.data.length ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
              </div>
              {data.pagination.totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-brand-500 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No events found" message="Try adjusting your filters or search terms." />
          )}
        </div>
      </div>
    </div>
  );
}
