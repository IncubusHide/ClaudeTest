import { LAUNDRY_STATUS_LABELS } from '@wardrobe/core';
import type { LaundryStatus } from '@wardrobe/core';

interface StatusPillProps {
  status: LaundryStatus;
  onClick?: () => void;
  title?: string;
}

export function StatusPill({ status, onClick, title }: StatusPillProps) {
  const className = `pill pill--${status.replace('_', '-')}`;

  if (!onClick) {
    return <span className={className}>{LAUNDRY_STATUS_LABELS[status]}</span>;
  }

  return (
    <button type="button" className={className} onClick={onClick} title={title}>
      {LAUNDRY_STATUS_LABELS[status]}
    </button>
  );
}
