import { useState, useEffect, useRef } from 'react';
import type { GeoLocation } from '@/lib/weather';
import { searchLocations } from '@/lib/weather';
import { Search, MapPin, Loader2, X, LocateFixed } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface LocationPickerProps {
  onSelect: (location: GeoLocation) => void;
  selectedLocation: GeoLocation | null;
  compact?: boolean;
}

export default function LocationPicker({ onSelect, selectedLocation, compact }: LocationPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = (q: string) => {
    setSearching(true);
    searchLocations(q)
      .then((locs) => {
        setResults(locs);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handleSelect = (loc: GeoLocation) => {
    onSelect(loc);
    setQuery('');
    setOpen(false);
    setShowSearch(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
    (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        searchLocations(`${lat.toFixed(2)},${lon.toFixed(2)}`).catch(() => {});
        fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
        )
          .then((r) => r.json())
          .then((data) => {
            if (data.results && data.results.length > 0) {
              const r = data.results[0];
              handleSelect({
                name: r.name,
                country: r.country || '',
                latitude: r.latitude,
                longitude: r.longitude,
                admin1: r.admin1,
              });
            } else {
              handleSelect({
                name: 'My Location',
                country: '',
                latitude: lat,
                longitude: lon,
              });
            }
          })
          .catch(() => {
            handleSelect({ name: 'My Location', country: '', latitude: lat, longitude: lon });
          })
          .finally(() => setSearching(false));
      },
      () => setSearching(false)
    );
  };

  if (compact && selectedLocation && !showSearch) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
      >
        <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {selectedLocation.name}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {selectedLocation.admin1 ? `${selectedLocation.admin1}, ` : ''}
            {selectedLocation.country}
          </p>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="text-xs font-medium text-green-600 hover:text-green-700 flex-shrink-0"
        >
          {t('location.change')}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('location.searchPlaceholder')}
          autoFocus={showSearch}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
        />
        {searching && (
          <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}
        {selectedLocation && !query && (
          <button
            onClick={() => setShowSearch(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick action: use my location */}
      <button
        onClick={useMyLocation}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <LocateFixed className="h-3.5 w-3.5" />
        {t('location.useMyLocation')}
      </button>

      {/* Search results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          {results.map((loc, i) => (
            <button
              key={`${loc.latitude}-${loc.longitude}-${i}`}
              onClick={() => handleSelect(loc)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50 border-b border-slate-50 last:border-0"
            >
              <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{loc.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {loc.admin1 ? `${loc.admin1}, ` : ''}
                  {loc.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !searching && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-6 text-center shadow-lg">
          <p className="text-sm text-slate-400">{t('location.noResults', { query })}</p>
        </div>
      )}
    </div>
  );
}
