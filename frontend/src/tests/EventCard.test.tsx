import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { EventItem } from '../types';

const mockEvent: EventItem = {
  id: '1',
  title: 'Sample Music Festival',
  slug: 'sample-music-festival',
  description: 'A great show',
  bannerUrl: undefined,
  category: { id: 'c1', name: 'Music', slug: 'music' },
  city: { id: 'ct1', name: 'Jakarta', country: 'Indonesia' },
  venue: 'GBK Stadium',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  isFree: false,
  status: 'PUBLISHED',
  ticketTypes: [{ id: 't1', name: 'Regular', price: 100000, quota: 100, sold: 0 }],
};

describe('EventCard', () => {
  it('renders event title and venue', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    );
    expect(screen.getByText('Sample Music Festival')).toBeInTheDocument();
    expect(screen.getByText(/GBK Stadium/)).toBeInTheDocument();
  });

  it('renders a fallback image when no banner is provided', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    );

    const image = screen.getByAltText('Sample Music Festival');
    expect(image).toHaveAttribute('src', '/images/default-event.svg');
  });
});
