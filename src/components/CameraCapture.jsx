import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CameraIcon } from './icons';

// In-page live camera capture via getUserMedia — works uniformly across desktop, mobile, and
// tablet browsers (unlike the file input's `capture` attribute, which desktop browsers ignore
// and mobile browsers hand off to the native camera app). A brief live preview is unavoidable
// here: the user needs to see what they're framing before snapping a still frame to canvas.
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null); // data URL of the captured frame, or null while live
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Could not access the camera. Check browser/site permissions and try again.'));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.92));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function retake() {
    setSnapshot(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Could not access the camera. Check browser/site permissions and try again.'));
  }

  async function confirmPhoto() {
    const res = await fetch(snapshot);
    const blob = await res.blob();
    onCapture(new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Take Selfie</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-900">
          {error ? (
            <p className="px-6 text-center text-sm text-gray-300">{error}</p>
          ) : snapshot ? (
            <img src={snapshot} alt="Captured selfie" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
          )}
        </div>

        <div className="flex justify-end gap-3">
          {error ? (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
          ) : snapshot ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={() => confirmPhoto().catch(() => toast.error('Failed to use captured photo'))}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Use Photo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capture}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <CameraIcon className="h-4 w-4" /> Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
