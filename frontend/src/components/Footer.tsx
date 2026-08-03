import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-orange-200 dark:border-neutral-800 bg-orange-100/80 dark:bg-neutral-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
      <div className="px-4 py-12 mx-auto max-w-7xl lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-3 text-lg font-bold gradient-text">Festify</h4>
            <p className="text-sm text-neutral-500">
              Discover and book the best events near you.
            </p>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Company</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/careers">Careers</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Organizers</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/organizer/dashboard">Create Event</Link>
              </li>
              <li>
                <Link to="/organizer/dashboard">Pricing</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Legal</h5>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/privacy">Privacy</Link>
              </li>
              <li>
                <Link to="/terms">Terms</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 mt-10 text-xs text-center border-t border-neutral-200 dark:border-neutral-800 text-neutral-400">
          © {new Date().getFullYear()} Festify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}