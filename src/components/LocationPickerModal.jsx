import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { resolveMapLink } from '../api/vehicles';
import { MapPinIcon } from './icons';

// Picks a vehicle's parking spot on Google Maps.
//  - With VITE_GOOGLE_MAPS_API_KEY set: an interactive map — search for a place, click or drag the pin.
//  - Always: open Google Maps, drop a pin, Share -> Copy link, and paste the link here (short
//    maps.app.goo.gl links are resolved by the backend), or type "lat, lng", or use this device's location.
// Calls onPick({ lat, lng, address }) — address is a suggestion from the map (empty when there's none).

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
// Whitefield, Bengaluru — where the map opens when the vehicle has no pin yet.
const DEFAULT_CENTER = { lat: 12.9698, lng: 77.75 };
const COORDS_RE = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

let mapsScript = null;
function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!mapsScript) {
    mapsScript = new Promise((resolve, reject) => {
      const callback = `__initRoamMaps${Date.now()}`;
      window[callback] = () => resolve(window.google.maps);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&callback=${callback}&v=weekly`;
      script.async = true;
      script.onerror = () => {
        mapsScript = null;
        reject(new Error('Google Maps failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return mapsScript;
}

const round6 = (n) => Math.round(n * 1e6) / 1e6;

function InteractiveMap({ point, onChange }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const center = point || DEFAULT_CENTER;
        const map = new maps.Map(ref.current, { center, zoom: point ? 16 : 13, streetViewControl: false, mapTypeControl: false });
        const marker = new maps.Marker({ map, position: point || null, draggable: true });
        geocoderRef.current = new maps.Geocoder();
        const place = (latLng) => {
          marker.setPosition(latLng);
          const next = { lat: round6(latLng.lat()), lng: round6(latLng.lng()) };
          geocoderRef.current.geocode({ location: next }, (results, status) => {
            onChange({ ...next, address: status === 'OK' && results[0] ? results[0].formatted_address : '' });
          });
        };
        map.addListener('click', (e) => place(e.latLng));
        marker.addListener('dragend', (e) => place(e.latLng));
        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // The map is built once; later picks move the marker directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A pin chosen another way (pasted link, device location) moves the map's marker too.
  useEffect(() => {
    if (point && markerRef.current) {
      markerRef.current.setPosition({ lat: point.lat, lng: point.lng });
      mapRef.current.panTo({ lat: point.lat, lng: point.lng });
    }
  }, [point]);

  function handleSearch(e) {
    e.preventDefault();
    if (!search.trim() || !geocoderRef.current) return;
    geocoderRef.current.geocode({ address: search, region: 'in' }, (results, status) => {
      if (status !== 'OK' || !results[0]) {
        toast.error('No place found — try a different search');
        return;
      }
      const loc = results[0].geometry.location;
      mapRef.current.setCenter(loc);
      mapRef.current.setZoom(17);
      markerRef.current.setPosition(loc);
      onChange({ lat: round6(loc.lat()), lng: round6(loc.lng()), address: results[0].formatted_address });
    });
  }

  if (failed) {
    return <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">The map couldn&apos;t load. Paste a Google Maps link below instead.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          placeholder="Search a place, e.g. Phoenix Marketcity, Bengaluru"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <button type="button" onClick={handleSearch} className="cursor-pointer rounded-lg bg-gray-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-gray-900">
          Search
        </button>
      </div>
      <div ref={ref} className="h-72 w-full overflow-hidden rounded-lg bg-gray-100" />
      <p className="text-xs text-gray-400">Click the map or drag the pin to the exact parking spot.</p>
    </div>
  );
}

export default function LocationPickerModal({ initial, onPick, onClose }) {
  const hasInitial = Number.isFinite(initial?.lat) && Number.isFinite(initial?.lng);
  const [point, setPoint] = useState(hasInitial ? { lat: initial.lat, lng: initial.lng, address: '' } : null);
  const [link, setLink] = useState('');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);

  const center = point || DEFAULT_CENTER;
  const googleMapsUrl = point
    ? `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
    : `https://www.google.com/maps/@${DEFAULT_CENTER.lat},${DEFAULT_CENTER.lng},14z`;

  async function handleLink(e) {
    e.preventDefault();
    const text = link.trim();
    if (!text) return;
    const coords = COORDS_RE.exec(text);
    if (coords) {
      const lat = Number(coords[1]);
      const lng = Number(coords[2]);
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        toast.error('Those coordinates are out of range');
        return;
      }
      setPoint({ lat: round6(lat), lng: round6(lng), address: '' });
      return;
    }
    setResolving(true);
    try {
      const place = await resolveMapLink(text);
      setPoint({ lat: place.lat, lng: place.lng, address: place.placeName || '' });
      toast.success('Location found');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read that link');
    } finally {
      setResolving(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("This browser can't share its location");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: round6(pos.coords.latitude), lng: round6(pos.coords.longitude), address: '' });
        setLocating(false);
      },
      () => {
        toast.error('Location permission was denied or unavailable');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <MapPinIcon className="h-5 w-5 text-blue-600" /> Choose Parking Location
          </h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {MAPS_KEY && <InteractiveMap point={point} onChange={setPoint} />}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700">{MAPS_KEY ? 'Or paste a Google Maps link' : 'Paste a Google Maps link'}</p>
            <ol className="list-decimal pl-5 text-xs leading-relaxed text-gray-500">
              <li>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                  Open Google Maps
                </a>{' '}
                and drop a pin on the parking spot (long-press on a phone, click on a computer).
              </li>
              <li>Tap Share → Copy link, then paste it here. You can also paste coordinates like 12.9698, 77.7500.</li>
            </ol>
            <form onSubmit={handleLink} className="flex gap-2">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://maps.app.goo.gl/…  or  12.9698, 77.7500"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={resolving || !link.trim()}
                className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resolving ? 'Finding…' : 'Use link'}
              </button>
            </form>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="w-fit cursor-pointer text-xs font-semibold text-blue-600 hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              {locating ? 'Getting your location…' : "I'm at the parking spot — use this device's location"}
            </button>
          </div>

          {point && (
            <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
              {!MAPS_KEY && (
                <iframe
                  title="Selected location"
                  src={`https://maps.google.com/maps?q=${center.lat},${center.lng}&z=16&output=embed`}
                  className="h-56 w-full border-0"
                  loading="lazy"
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span>
                  📍 {point.lat}, {point.lng}
                  {point.address && <span className="ml-1 text-gray-500">· {point.address}</span>}
                </span>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                  Check on Google Maps
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button
              type="button"
              disabled={!point}
              onClick={() => onPick(point)}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
