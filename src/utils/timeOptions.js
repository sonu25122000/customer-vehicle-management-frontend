// Half-hour interval time-of-day options for trip start/end time pickers. The native
// <input type="time" step="1800"> approach doesn't reliably restrict the browser's own
// picker UI to 30-minute increments (Chrome's flyout still scrolls through every minute),
// so this is a plain dropdown instead — value stays "HH:mm" to match the existing backend format.
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return { value, label: `${String(displayHour).padStart(2, '0')}:${minutes} ${period}` };
});
