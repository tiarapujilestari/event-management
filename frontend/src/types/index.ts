export type Role = 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  referralCode: string;
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface City {
  id: string;
  name: string;
  province?: string | null;
  country: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  description?: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string | null;
  category: Category;
  city: City;
  venue: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  ticketTypes: TicketType[];
  minPrice?: number;
  _count?: { wishlistedBy: number; reviews?: number };
}
