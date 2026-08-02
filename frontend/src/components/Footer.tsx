import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-3 font-bold gradient-text text-lg">Eventify</h4>
            <p className="text-sm text-neutral-500">Discover and book the best events near you.</p>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Company</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/careers">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Organizers</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link to="/organizer/dashboard">Create Event</Link></li>
              <li><Link to="/organizer/dashboard">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Legal</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Eventify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
