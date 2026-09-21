// Color reflects the rating itself, using its real (possibly fractional) value — a 3.3 must not
// look like a 4 or a 5. Bands: <2 red, <3 orange, <4 amber, <4.5 lime, 4.5+ green. Whole ratings
// keep their familiar colors (1 red, 2 orange, 3 amber, 4 lime, 5 green).
function ratingColor(value) {
  if (value <= 0) return 'text-gray-300';
  if (value < 2) return 'text-red-500';
  if (value < 3) return 'text-orange-500';
  if (value < 4) return 'text-amber-500';
  if (value < 4.5) return 'text-lime-500';
  return 'text-green-500';
}

// `value` may be fractional for display (e.g. a vehicle's 4.5 average): each star is filled in
// proportion, so 4.5 shows four full stars and a half one instead of rounding up to five. Picking a
// rating (onChange) is always a whole number of stars.
export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const starSize = size === 'sm' ? 'text-base' : 'text-xl';
  const rating = Math.min(Math.max(Number(value) || 0, 0), 5);
  const filledColor = ratingColor(rating);

  return (
    <span
      className="inline-flex gap-0.5"
      role={readOnly ? 'img' : undefined}
      aria-label={readOnly ? `${Math.round(rating * 10) / 10} out of 5 stars` : undefined}
    >
      {stars.map((star) => {
        const fill = Math.min(Math.max(rating - (star - 1), 0), 1);
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange?.(star === rating ? 0 : star)}
            disabled={readOnly}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className={`${starSize} relative inline-block leading-none text-gray-300 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            ★
            {fill > 0 && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 overflow-hidden whitespace-nowrap ${filledColor}`}
                style={{ width: `${Math.round(fill * 1000) / 10}%` }}
              >
                ★
              </span>
            )}
          </button>
        );
      })}
    </span>
  );
}
