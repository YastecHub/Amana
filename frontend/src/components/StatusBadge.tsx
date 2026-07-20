import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-gray-100 text-gray-700';
  switch (status.toLowerCase()) {
    case 'approved': colorClass = 'bg-blue-100 text-blue-700'; break;
    case 'disbursed': colorClass = 'bg-teal-100 text-teal-700'; break;
    case 'repaying': colorClass = 'bg-purple-100 text-purple-700'; break;
    case 'closed': colorClass = 'bg-green-100 text-green-700'; break;
    case 'defaulted': colorClass = 'bg-red-100 text-red-700'; break;
    case 'requested': colorClass = 'bg-gray-100 text-gray-700'; break;
    case 'active': colorClass = 'bg-green-100 text-green-700'; break;
    case 'suspended': colorClass = 'bg-red-100 text-red-700'; break;
  }
  
  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', colorClass)}>
      {status}
    </span>
  );
}
