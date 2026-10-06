import { useState } from 'react';
import { Edit2, Map, List, AlertCircle, RefreshCw, ChevronRight, Zap, Accessibility, ChevronDown } from 'lucide-react';
import { Carpark, SearchParams } from '../types/index.ts';
import MapView from './MapView.tsx';

interface ScreenResultsProps {
  searchParams: SearchParams;
  carparks: Carpark[];
  isLoading: boolean;
  isError: boolean;
  isFallback: boolean;
  onEditSearch: () => void;
  onSelectCarpark: (carpark: Carpark) => void;
  onToggleEV: () => void;
  onToggleAccessible: () => void;
  onRetry: () => void;
}

export default function ScreenResults({
  searchParams,
  carparks,
  isLoading,
  isError,
  isFallback,
  onEditSearch,
  onSelectCarpark,
  onToggleEV,
  onToggleAccessible,
  onRetry
}: ScreenResultsProps) {
  // Mobile view mode: 'list' or 'map'
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  // Top 3 car parks, then "Show more"
  const [showAllCarparks, setShowAllCarparks] = useState(false);
  const [selectedCarparkForMap, setSelectedCarparkForMap] = useState<Carpark | null>(carparks[0] || null);

  const displayedCarparks = showAllCarparks ? carparks : carparks.slice(0, 3);
  const hasMore = carparks.length > 3 && !showAllCarparks;

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* 1. Compact Summary Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-14 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Summary String & Edit Button */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              <span>{searchParams.destinationName}</span>
              <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
              <span>{searchParams.dateLabel}</span>
              <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
              <span className="font-mono">{searchParams.arrivalTime}</span>
              <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
              <span>{searchParams.durationHours}h</span>
            </div>

            <button
              onClick={onEditSearch}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded-md min-h-[36px] transition-colors focus-visible:outline-2 focus-visible:outline-emerald-800"
              aria-label="Edit search parameters"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Quick Filter Chips & List/Map Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* EV & Accessible Chips */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleEV}
                aria-pressed={searchParams.needEV}
                className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  searchParams.needEV
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Filter for car parks with EV charging"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>EV</span>
              </button>

              <button
                type="button"
                onClick={onToggleAccessible}
                aria-pressed={searchParams.needAccessible}
                className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  searchParams.needAccessible
                    ? 'bg-sky-50 text-sky-900 border-sky-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle Accessible lots reminder"
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Accessible</span>
              </button>
            </div>

            {/* Mobile List / Map Segmented Toggle (Top Right) */}
            <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setMobileView('list')}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                  mobileView === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Show list view"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                  mobileView === 'map'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Show map view"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible notice when accessible chip is on */}
      {searchParams.needAccessible && (
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-sky-900 font-medium">
            <Accessibility className="w-4 h-4 text-sky-700 shrink-0" />
            <span>Accessible lot info isn't available yet. Please check on arrival.</span>
          </div>
        </div>
      )}

      {/* Saved snapshot resilience banner */}
      {isFallback && !isLoading && !isError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              <span>Showing saved data (live feed backup for Marina Bay Sands)</span>
            </div>
            <button
              onClick={onRetry}
              className="font-bold underline hover:text-amber-950 min-h-[32px] px-2 flex items-center"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto">
        
        {/* LEFT COLUMN (List): Always visible on desktop; on mobile shown if mobileView === 'list' */}
        <div className={`w-full lg:w-[480px] lg:border-r border-slate-200 flex flex-col bg-slate-50 ${
          mobileView === 'map' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          <div className="p-4 flex-1 space-y-3">
            {/* Loading State */}
            {isLoading && (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Searching car parks within 1 km…</p>
                <p className="text-xs text-slate-500">Estimating parking rates and checking lots</p>
              </div>
            )}

            {/* Error State with "Try again" */}
            {isError && (
              <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3 shadow-xs">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Unable to load live parking data</h3>
                <p className="text-xs text-slate-600">The connection timed out or the service is temporarily unavailable.</p>
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try again</span>
                </button>
              </div>
            )}

            {/* Empty State: "No car parks within 1 km" */}
            {!isLoading && !isError && carparks.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 my-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-xl">
                  🚗
                </div>
                <h3 className="text-base font-bold text-slate-900">No car parks within 1 km</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  {searchParams.needEV
                    ? 'No car parks with EV charging found within 1 km. Try turning off the EV filter or searching another area.'
                    : 'No car parks recorded within 1 km of this destination. Try searching a nearby landmark.'}
                </p>
                <button
                  onClick={onEditSearch}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Change destination</span>
                </button>
              </div>
            )}

            {/* Car Park Cards: Top 3, then "Show more" link */}
            {!isLoading && !isError && carparks.length > 0 && (
              <>
                <div className="space-y-3">
                  {displayedCarparks.map((cp) => {
                    const isSelected = selectedCarparkForMap?.id === cp.id;

                    return (
                      <div
                        key={cp.id}
                        onClick={() => {
                          setSelectedCarparkForMap(cp);
                          onSelectCarpark(cp);
                        }}
                        className={`w-full bg-white rounded-2xl border p-4.5 text-left transition-all cursor-pointer relative hover:border-emerald-600 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                          isSelected ? 'border-emerald-700 ring-1 ring-emerald-700 shadow-xs' : 'border-slate-200/90'
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSelectCarpark(cp);
                          }
                        }}
                      >
                        {/* Top row: Name & At most ONE badge */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug truncate flex-1">
                            {cp.name}
                          </h3>
                          {cp.badge && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
                                cp.badge === 'Best value'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cp.badge === 'Cheapest'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cp.badge}
                            </span>
                          )}
                        </div>

                        {/* Middle row: Large estimated cost & Distance */}
                        <div className="mt-3 flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                              {cp.estimatedCost !== null ? `$${cp.estimatedCost.toFixed(2)}` : 'Rate unavail'}
                            </span>
                            {cp.isApproximateRate && cp.estimatedCost !== null && (
                              <span className="ml-1.5 text-[11px] text-slate-500 font-medium">Approx</span>
                            )}
                          </div>
                          
                          <span className="text-xs font-medium text-slate-500">
                            {cp.distanceMeters < 1000 ? `${cp.distanceMeters}m away` : `${cp.distanceKm}km away`}
                          </span>
                        </div>

                        {/* Bottom row: Live lots availability & EV pill */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                cp.availableLots > 20
                                  ? 'bg-emerald-500'
                                  : cp.availableLots > 0
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-slate-700 tabular-nums">
                              {cp.availableLots > 0 ? `${cp.availableLots} car lots available` : 'Full / No lots'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {cp.evChargers.length > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                                <span>⚡</span> {cp.evChargers.length} EV
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* "Show more" link */}
                {hasMore && (
                  <div className="text-center pt-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setShowAllCarparks(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 py-2.5 px-4 rounded-xl min-h-[44px] transition-colors"
                    >
                      <span>Show {carparks.length - 3} more car parks</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* One-line footer: Estimates based on Nov 2018 rates. Check signage. */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              Estimates based on Nov 2018 rates. Check signage.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (Map): Always visible on desktop; on mobile shown if mobileView === 'map' */}
        <div className={`flex-1 relative min-h-[380px] lg:min-h-[580px] ${
          mobileView === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <MapView
            searchParams={searchParams}
            carparks={carparks}
            selectedCarpark={selectedCarparkForMap}
            onSelectCarpark={(cp) => {
              setSelectedCarparkForMap(cp);
              onSelectCarpark(cp);
            }}
            className="w-full h-full min-h-[420px]"
          />

          {/* On Mobile Map View: Bottom Sheet Preview Card of selected car park */}
          {mobileView === 'map' && selectedCarparkForMap && (
            <div className="lg:hidden absolute bottom-4 left-4 right-4 z-30">
              <div
                onClick={() => onSelectCarpark(selectedCarparkForMap)}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {selectedCarparkForMap.name}
                    </h4>
                    {selectedCarparkForMap.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {selectedCarparkForMap.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {selectedCarparkForMap.estimatedCost !== null
                        ? `$${selectedCarparkForMap.estimatedCost.toFixed(2)}`
                        : 'Rate unavail'}
                    </span>
                    <span className="text-slate-500">
                      {selectedCarparkForMap.distanceMeters}m away
                    </span>
                    <span className="text-emerald-700 font-semibold tabular-nums">
                      {selectedCarparkForMap.availableLots} lots
                    </span>
                  </div>
                </div>
                <div className="shrink-0 bg-emerald-700 text-white rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
