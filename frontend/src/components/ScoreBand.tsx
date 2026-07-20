import { cn, getScoreBandColor } from '@/lib/utils';

export function ScoreBand({ band }: { band: 'A' | 'B' | 'C' | 'D' }) {
  return (
    <span
      className={cn(
        'px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center',
        getScoreBandColor(band)
      )}
    >
      Band {band.toUpperCase()}
    </span>
  );
}
