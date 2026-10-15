import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, StarSolidIcon } from '../components/icons';
import {
  fetchTestimonials,
  fetchReviewCandidates,
  createTestimonial,
  updateTestimonial,
  reorderTestimonials,
  deleteTestimonial,
} from '../api/testimonials';

const inputClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

// "Ravi Kumar" -> "Ravi K." — the website never shows customers' full names.
function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

function SlideFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    subtitle: initial?.subtitle || '',
    text: initial?.text || '',
    rating: initial?.rating || 5,
    carName: initial?.carName || '',
    trip: initial?.trip || '',
  });
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return toast.error('Name and review are required');
    setSaving(true);
    try {
      const res = editing ? await updateTestimonial(initial._id, form) : await createTestimonial(form);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <form onSubmit={submit} noValidate className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Slide' : 'Add Slide'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Name shown</span>
              <input value={form.name} maxLength={50} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi K." className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Subtitle (optional)</span>
              <input value={form.subtitle} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Weekend trip to Coorg" className={inputClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Review</span>
            <textarea
              rows={4}
              maxLength={500}
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className={`${inputClass} resize-none`}
            />
            <span className="self-end text-[0.65rem] text-gray-400">{form.text.length}/500</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Rating</span>
              <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v || 1 }))} />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Car (optional)</span>
              <input value={form.carName} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, carName: e.target.value }))} placeholder="e.g. Maruti Baleno" className={inputClass} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// The reviews carousel on the website's home page: which reviews show, in what order (up to 7 at once).
export default function HomeCarouselPage() {
  const [slides, setSlides] = useState(null);
  const [maxActive, setMaxActive] = useState(7);
  const [reviews, setReviews] = useState(null);
  const [modal, setModal] = useState(null); // slide | prefill | {}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchTestimonials()
      .then((res) => {
        setSlides(res.data);
        setMaxActive(res.maxActive);
      })
      .catch(() => toast.error('Failed to load the carousel'));
    fetchReviewCandidates()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = (slides || []).filter((s) => s.isActive).length;

  async function move(index, delta) {
    const next = [...slides];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setSlides(next);
    try {
      await reorderTestimonials(next.map((s) => s._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save the order');
      load();
    }
  }

  async function toggle(slide) {
    setBusy(true);
    try {
      const res = await updateTestimonial(slide._id, { ...slide, isActive: !slide.isActive });
      toast.success(res.data.isActive ? 'Shown on the website' : 'Hidden from the website');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteTestimonial(deleteTarget._id);
      toast.success('Removed from the carousel');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="mr-auto">
          <p className="text-sm font-semibold text-gray-900">Reviews carousel on the home page</p>
          <p className="text-xs text-gray-500">
            Rotates automatically on the website: the 5 latest 4–5★ customer reviews always come first (newest first), then your pinned
            slides below, up to {maxActive} in all. {activeCount} pinned.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({})}
          disabled={activeCount >= maxActive}
          title={activeCount >= maxActive ? `Hide a slide first — at most ${maxActive} are shown` : undefined}
          className="cursor-pointer rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add Slide
        </button>
      </div>

      {slides === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
      ) : !slides.length ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">No slides yet — add one, or pick from customer reviews below.</div>
      ) : (
        <ol className="flex flex-col gap-2">
          {slides.map((s, i) => (
            <li key={s._id} className={`flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center ${s.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-1 sm:flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeftIcon className="h-4 w-4 sm:rotate-90" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-gray-500">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === slides.length - 1}
                  aria-label="Move down"
                  className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:rotate-90" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{s.name}</span>
                  {s.subtitle && <span className="text-xs text-gray-400">{s.subtitle}</span>}
                  <StarRating value={s.rating} readOnly size="sm" />
                  {s.carName && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold text-gray-600">{s.carName}</span>}
                  {s.trip && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[0.65rem] font-semibold text-blue-700">Customer review</span>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">&ldquo;{s.text}&rdquo;</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  disabled={busy}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${s.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s.isActive ? 'Shown' : 'Hidden'}
                </button>
                <button type="button" onClick={() => setModal(s)} aria-label="Edit" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100">
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(s)} aria-label="Remove" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Customer reviews</p>
        <p className="mb-3 text-xs text-gray-500">Reviews customers wrote after their trips, newest first. The 5 latest 4–5★ ones already appear on the website automatically — pin an older one to keep it in the carousel (you can edit the text and name first).</p>
        {reviews === null ? (
          <div className="h-24 animate-pulse rounded-lg bg-gray-50" />
        ) : !reviews.length ? (
          <p className="text-xs text-gray-400">No written reviews yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <li key={r._id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-900">{r.customerName}</span>
                    <span className="flex items-center gap-0.5 font-semibold text-amber-600">
                      <StarSolidIcon className="h-3 w-3" /> {r.rating}
                    </span>
                    {r.carName && <span className="text-gray-400">{r.carName}</span>}
                    <span className="font-mono text-[0.65rem] text-gray-400">{r.tripId}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">&ldquo;{r.review}&rdquo;</p>
                </div>
                {r.inCarousel ? (
                  <span className="flex-shrink-0 text-xs font-semibold text-emerald-600">Pinned</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModal({ name: shortName(r.customerName), text: r.review, rating: r.rating, carName: r.carName, trip: r._id })}
                    disabled={activeCount >= maxActive}
                    className="flex-shrink-0 cursor-pointer rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Pin to carousel
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <SlideFormModal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      <ConfirmDeleteModal
        target={deleteTarget ? { name: `${deleteTarget.name}'s review`, detail: 'from the carousel' } : null}
        title="Remove Slide"
        verb="remove"
        confirmLabel="Remove"
        busyLabel="Removing..."
        message="It will no longer appear on the website. The customer's original review stays on their trip."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={busy}
      />
    </div>
  );
}
