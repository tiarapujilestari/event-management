import { Tag, CreditCard, QrCode, Wallet, Landmark } from 'lucide-react';

interface MarqueeItem {
  icon: React.ReactNode;
  label: string;
}

const promoItems: MarqueeItem[] = [
  { icon: <Tag className="w-4 h-4" />, label: 'Diskon 20% untuk semua tiket!' },
  { icon: <CreditCard className="w-4 h-4" />, label: 'Mastercard' },
  { icon: <CreditCard className="w-4 h-4" />, label: 'Visa' },
  { icon: <QrCode className="w-4 h-4" />, label: 'QRIS' },
  { icon: <Landmark className="w-4 h-4" />, label: 'BCA' },
  { icon: <Landmark className="w-4 h-4" />, label: 'Mandiri' },
  { icon: <Landmark className="w-4 h-4" />, label: 'BRI' },
  { icon: <Landmark className="w-4 h-4" />, label: 'BSI' },
  { icon: <Wallet className="w-4 h-4" />, label: 'E-Wallet' },
];

function MarqueeTrack() {
  return (
    <div className="flex items-center gap-8 pr-8 shrink-0">
      {promoItems.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-neutral-700 dark:text-neutral-200"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            {item.icon}
          </span>
          {item.label}
          <span className="ml-6 text-neutral-300 dark:text-neutral-700">•</span>
        </span>
      ))}
    </div>
  );
}

export default function PromoMarquee() {
  return (
    <div className="py-4 overflow-hidden bg-white border-y border-neutral-100 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="group flex w-max animate-marquee hover:[animation-play-state:paused]">
        <MarqueeTrack />
        <MarqueeTrack />
      </div>
    </div>
  );
}
