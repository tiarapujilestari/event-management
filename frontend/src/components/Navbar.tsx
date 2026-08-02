import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, User as UserIcon, Heart, Ticket, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/events?search=${encodeURIComponent(query)}`);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled ? 'glass shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <span className="gradient-text">Eventify</span>
        </Link>

        <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues, organizers..."
            className="input !pl-10"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          <Link to="/events" className="text-sm font-medium hover:text-brand-500 transition-colors">
            Explore
          </Link>
          {user?.role === 'ORGANIZER' && (
            <Link to="/organizer/dashboard" className="text-sm font-medium hover:text-brand-500 transition-colors">
              Dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="text-sm font-medium hover:text-brand-500 transition-colors">
              Admin
            </Link>
          )}

          <button onClick={() => setDark((d) => !d)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/wishlist" className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Heart className="h-4 w-4" />
              </Link>
              <Link to="/orders" className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Ticket className="h-4 w-4" />
              </Link>
              <Link to="/profile" className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <UserIcon className="h-4 w-4" />
              </Link>
              <button onClick={() => logout()} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary !px-4 !py-2 text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Sign up
              </Link>
            </div>
          )}
        </nav>

        <button className="ml-auto md:hidden" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-100 dark:border-neutral-800 md:hidden"
          >
            <div className="flex flex-col gap-3 px-4 py-4">
              <Link to="/events" onClick={() => setMenuOpen(false)}>Explore</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)}>My Tickets</Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                  {user.role === 'ORGANIZER' && <Link to="/organizer/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
                  {user.role === 'ADMIN' && <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin</Link>}
                  <button className="text-left text-red-500" onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
