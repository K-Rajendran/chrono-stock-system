const statusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'status-requested' },
  PENDING: { label: 'Pending', className: 'status-pending' },
  UNDER_REVIEW: { label: 'Under Review', className: 'status-under-review' },
  BILL_GENERATED: { label: 'Bill Generated', className: 'status-bill-generated' },
  SENT: { label: 'Sent', className: 'status-bill-generated' },
  PAID: { label: 'Paid', className: 'status-paid' },
  COMPLETED: { label: 'Completed', className: 'status-completed' },
  CANCELLED: { label: 'Cancelled', className: 'status-cancelled' },
  PARTIAL: { label: 'Partial', className: 'status-partial' },
  IN_STOCK: { label: 'In Stock', className: 'status-paid' },
  LOW_STOCK: { label: 'Low Stock', className: 'status-pending' },
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'status-cancelled' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'status-pending' };

  return (
    <span
      className={config.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '20px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: '600',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
