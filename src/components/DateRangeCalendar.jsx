import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { toISODate, parseISODate, formatDisplayDate } from '../utils/dateRanges';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateRangeCalendar({ startDate, endDate, onChange }) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const today = new Date();

  const [view, setView] = useState(() => {
    const anchor = end || start || today;
    return { year: anchor.getFullYear(), month: anchor.getMonth() };
  });

  const cells = buildMonthCells(view.year, view.month);

  function changeMonth(delta) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function handlePick(day) {
    const picked = new Date(view.year, view.month, day);

    // No range yet, or a full range already selected -> start a fresh range
    if (!start || (start && end)) {
      onChange({ startDate: toISODate(picked), endDate: '' });
      return;
    }

    // Have a start, picking the end -> normalize order
    if (picked < start) {
      onChange({ startDate: toISODate(picked), endDate: toISODate(start) });
    } else {
      onChange({ startDate: toISODate(start), endDate: toISODate(picked) });
    }
  }

  function cellState(day) {
    if (!day) return {};
    const date = new Date(view.year, view.month, day);
    const isStart = sameDay(date, start);
    const isEnd = sameDay(date, end);
    const inRange = start && end && date > start && date < end;
    const isToday = sameDay(date, today);
    return { isStart, isEnd, inRange, isToday };
  }

  return (
    <div className="border-t border-gray-100 p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">From</p>
          <p className={`text-sm font-semibold ${start ? 'text-gray-900' : 'text-gray-400'}`}>
            {startDate ? formatDisplayDate(startDate) : 'Select date'}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">To</p>
          <p className={`text-sm font-semibold ${end ? 'text-gray-900' : 'text-gray-400'}`}>
            {endDate ? formatDisplayDate(endDate) : 'Select date'}
          </p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-gray-900">
          {new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[0.65rem] font-semibold text-gray-400">
            {w}
          </span>
        ))}

        {cells.map((day, idx) => {
          if (!day) return <span key={`blank-${idx}`} />;
          const { isStart, isEnd, inRange, isToday } = cellState(day);
          const isEdge = isStart || isEnd;

          return (
            <button
              type="button"
              key={day}
              onClick={() => handlePick(day)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center text-xs transition-colors ${
                isEdge
                  ? 'rounded-full bg-blue-600 font-bold text-white'
                  : inRange
                    ? 'bg-blue-50 text-blue-700'
                    : isToday
                      ? 'rounded-full font-bold text-blue-600'
                      : 'rounded-full text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
