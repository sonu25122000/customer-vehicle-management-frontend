import { useEffect } from 'react';
import { XIcon } from './icons';

export default function ImageLightbox({ src, label, onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  const isPdf = src.startsWith('data:application/pdf');

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <XIcon className="h-5 w-5" />
      </button>
      {label && (
        <span className="absolute left-4 top-4 rounded-md bg-black/40 px-3 py-1.5 text-sm font-medium text-white/90">
          {label}
        </span>
      )}

      {isPdf ? (
        <iframe
          src={src}
          title={label || 'Document preview'}
          onClick={(e) => e.stopPropagation()}
          className="h-[85vh] w-[92vw] rounded-lg bg-white shadow-2xl sm:w-[80vw]"
        />
      ) : (
        <img
          src={src}
          alt={label || 'Preview'}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
        />
      )}
    </div>
  );
}
