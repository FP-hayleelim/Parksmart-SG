import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { GeocodeResult, SearchParams } from '../types/index.ts';

interface ScreenSearchProps {
  onSearch: (params: SearchParams) => void;
  initialParams?: Partial<SearchParams>;
}

// Compute today's date formatted as "Tue, 06 Oct"
function formatSGDateLabel(d: Date): string {
  const weekday = d.toLocaleDateString('en-SG', { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-SG', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

function getTodayISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Now rounded up to next 15 minutes in 24-hour format (e.g. 09:30)
function getRoundedNow24H(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 15;
  const add = remainder === 0 ? 0 : 15 - remainder;
  now.setMinutes(minutes + add);
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function ScreenSearch({ onSearch, initialParams }: ScreenSearchProps) {
  const now = new Date();
  const todayISO = getTodayISODate(now);
  const todayLabel = formatSGDateLabel(now);

  // Form states: empty destination by default
  const [destinationQuery, setDestinationQuery] = useState(initialParams?.destinationName || '');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(
    initialParams?.latitude && initialParams?.longitude && initialParams?.destinationName
      ? {
          name: initialParams.destinationName,
          latitude: initialParams.latitude,
          longitude: initialParams.longitude
        }
      : null
  );

  const [dateStr, setDateStr] = useState(initialParams?.dateStr || todayISO);
  const [dateLabel, setDateLabel] = useState(initialParams?.dateLabel || todayLabel);
  const [arrivalTime, setArrivalTime] = useState(initialParams?.arrivalTime || getRoundedNow24H());
  const [durationHours, setDurationHours] = useState<number>(initialParams?.durationHours ?? 2);
  const [isMoreDuration, setIsMoreDuration] = useState<boolean>(initialParams?.durationHours ? initialParams.durationHours > 4 : false);

  // Toggle chips remembered in localStorage
  const [needEV, setNeedEV] = useState<boolean>(() => {
    if (initialParams?.needEV !== undefined) return initialParams.needEV;
    return localStorage.getItem('parksmart_pref_ev') === 'true';
  });

  const [needAccessible, setNeedAccessible] = useState<boolean>(() => {
    if (initialParams?.needAccessible !== undefined) return initialParams.needAccessible;
    return localStorage.getItem('parksmart_pref_accessible') === 'true';
  });

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('parksmart_pref_ev', String(needEV));
  }, [needEV]);

  useEffect(() => {
    localStorage.setItem('parksmart_pref_accessible', String(needAccessible));
  }, [needAccessible]);

  // Handle Autocomplete with OneMap Search API
  useEffect(() => {
    if (!destinationQuery || destinationQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (selectedLocation && selectedLocation.name === destinationQuery) {
      setShowDropdown(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const resp = await fetch(`/api/geocode?q=${encodeURIComponent(destinationQuery.trim())}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.results)) {
            setSuggestions(data.results);
            setShowDropdown(data.results.length > 0);
          }
        }
      } catch (err) {
        console.warn('OneMap geocode fetch error:', err);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [destinationQuery, selectedLocation]);

  // "Near me" handler using browser geolocation + OneMap reverse geocoding
  const handleNearMe = () => {
    setGeoError(null);
    setFormError(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let placeName = 'Near me (Current Location)';

        try {
          // Resolve actual Singapore address or building name via reverse geocode
          const resp = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.results?.[0]?.title) {
              placeName = data.results[0].title;
            }
          }
        } catch {
          // Keep coordinates fallback label
        }

        setLocatingUser(false);
        setDestinationQuery(placeName);
        setSelectedLocation({
          name: placeName,
          latitude,
          longitude
        });
        setShowDropdown(false);
      },
      (error) => {
        setLocatingUser(false);
        console.warn('Geolocation error:', error.message);
        setGeoError('Location access was denied or unavailable. Please search for a place above.');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    setDestinationQuery(item.title);
    setSelectedLocation({
      name: item.title,
      latitude: item.latitude,
      longitude: item.longitude
    });
    setFormError(null);
    setShowDropdown(false);
  };

  const handleDateChange = (newDateStr: string) => {
    setDateStr(newDateStr);
    const [y, m, d] = newDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    setDateLabel(formatSGDateLabel(target));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const trimmedQuery = destinationQuery.trim();
    if (!trimmedQuery && !selectedLocation) {
      setFormError('Please enter a destination or tap "Near me"');
      inputRef.current?.focus();
      return;
    }

    let finalLocation = selectedLocation;

    // If user typed destination without clicking an autocomplete item, resolve it via OneMap
    if (!finalLocation || finalLocation.name !== trimmedQuery) {
      setIsSearchingGeo(true);
      try {
        const resp = await fetch(`/api/geocode?q=${encodeURIComponent(trimmedQuery)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            const top = data.results[0];
            finalLocation = {
              name: top.title,
              latitude: top.latitude,
              longitude: top.longitude
            };
          }
        }
      } catch (err) {
        console.warn('Geocoding resolve failed:', err);
      } finally {
        setIsSearchingGeo(false);
      }
    }

    if (!finalLocation) {
      setFormError('Destination not found in Singapore. Please select from the search suggestions.');
      return;
    }

    onSearch({
      destinationName: finalLocation.name,
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
      dateStr,
      dateLabel,
      arrivalTime,
      durationHours,
      needEV,
      needAccessible,
      radiusMeters: 1000
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 md:py-10">
      {/* Search Card: One card containing all controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-7 space-y-6">
        
        {/* 1. Destination Field */}
        <div className="relative space-y-2">
          <label htmlFor="destination-input" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Destination
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="destination-input"
              ref={inputRef}
              type="text"
              autoComplete="off"
              value={destinationQuery}
              onChange={(e) => {
                setDestinationQuery(e.target.value);
                setFormError(null);
                setGeoError(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Search any place in Singapore"
              className="w-full h-12 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
            {isSearchingGeo && (
              <Loader2 className="absolute right-3.5 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors focus:bg-slate-50 focus:outline-none"
                >
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* "Near me" button using browser geolocation */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={handleNearMe}
              disabled={locatingUser}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 min-h-[44px] -my-2 py-2 px-1 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-emerald-800"
            >
              <Navigation className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
              <span>{locatingUser ? 'Locating…' : 'Near me'}</span>
            </button>
            {geoError && (
              <span className="text-[11px] text-amber-700">{geoError}</span>
            )}
          </div>

          {formError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        {/* 2 & 3. Date & Arrival Time (24-hour) */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {/* Date */}
          <div className="space-y-1.5">
            <label htmlFor="parking-date" className="block text-xs font-semibold text-slate-700 tracking-wide">
              Date
            </label>
            <div className="relative">
              <input
                id="parking-date"
                type="date"
                value={dateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 pl-0.5">{dateLabel}</p>
          </div>

          {/* Arrival Time: 24-hour format, defaults to now rounded up to 15 min */}
          <div className="space-y-1.5">
            <label htmlFor="arrival-time" className="block text-xs font-semibold text-slate-700 tracking-wide">
              Arrival time (24h)
            </label>
            <input
              id="arrival-time"
              type="time"
              step="900"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-slate-500 pl-0.5">24-hour format</p>
          </div>
        </div>

        {/* 4. Duration: one row of chips: 1h, 2h (default), 3h, 4h, More. No dropdown. */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide">
            Duration
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Duration">
            {[1, 2, 3, 4].map((hours) => {
              const isSelected = !isMoreDuration && durationHours === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setDurationHours(hours);
                    setIsMoreDuration(false);
                  }}
                  className={`flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {hours}h
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={isMoreDuration}
              onClick={() => {
                setIsMoreDuration(true);
                if (durationHours <= 4) setDurationHours(5);
              }}
              className={`flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                isMoreDuration
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {isMoreDuration ? `${durationHours}h` : 'More'}
            </button>
          </div>

          {/* Stepper when "More" is chosen (no dropdown) */}
          {isMoreDuration && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-2">
              <span className="text-xs font-medium text-slate-600">Extended stay:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDurationHours(Math.max(5, durationHours - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-sm"
                  aria-label="Decrease hours"
                >
                  -
                </button>
                <span className="text-sm font-bold text-slate-900 w-10 text-center font-mono">
                  {durationHours}h
                </span>
                <button
                  type="button"
                  onClick={() => setDurationHours(Math.min(24, durationHours + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-sm"
                  aria-label="Increase hours"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. "I need:" two optional toggle chips, off by default, both selectable together */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide">
            I need:
          </label>
          <div className="flex items-center gap-2.5">
            {/* EV charging chip */}
            <button
              type="button"
              onClick={() => setNeedEV(!needEV)}
              aria-pressed={needEV}
              className={`flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                needEV
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span aria-hidden="true">⚡</span>
              <span>EV charging</span>
            </button>

            {/* Accessible lot chip */}
            <button
              type="button"
              onClick={() => setNeedAccessible(!needAccessible)}
              aria-pressed={needAccessible}
              className={`flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                needAccessible
                  ? 'bg-sky-50 text-sky-900 border-sky-500 shadow-xs ring-1 ring-sky-500'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span aria-hidden="true">♿</span>
              <span>Accessible lot</span>
            </button>
          </div>
        </div>

        {/* Primary full-width button: "Find parking" */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="w-full h-12 rounded-xl bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-800"
          >
            <Search className="w-4 h-4" />
            <span>Find parking</span>
          </button>
        </div>

      </div>
    </div>
  );
}
