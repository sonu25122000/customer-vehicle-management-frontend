// Color reflects the overall rating given, not just "filled vs empty" — low ratings
// read as red/orange, high ratings read as green, at a glance.
const RATING_COLORS = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-amber-500',
  4: 'text-lime-500',
  5: 'text-green-500',
};

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const starSize = size === 'sm' ? 'text-base' : 'text-xl';
  const filledColor = RATING_COLORS[value] || 'text-gray-300';

  return (
    <span className="inline-flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star === value ? 0 : star)}
          disabled={readOnly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`${starSize} leading-none transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
            star <= value ? filledColor : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
