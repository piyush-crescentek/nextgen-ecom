interface PricingDiscountBadgeProps {
  label: string;
}

export default function PricingDiscountBadge({
  label,
}: PricingDiscountBadgeProps) {
  return (
    <span className="absolute -top-2.5 right-3 z-10 rounded-full bg-(--btncolor) px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
      {label}
    </span>
  );
}
