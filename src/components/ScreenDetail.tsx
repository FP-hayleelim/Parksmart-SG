import { ArrowLeft, Navigation, Zap, Accessibility, Clock, Info, CheckCircle2 } from 'lucide-react';
import { Carpark, SearchParams } from '../types/index.ts';

interface ScreenDetailProps {
  carpark: Carpark;
  searchParams: SearchParams;
  onBack: () => void;
}

export default function ScreenDetail({
  carpark,
  searchParams,
  onBack
}: ScreenDetailProps) {
  // Google Maps directions URL without any API key required
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.latitude},${carpark.longitude}`;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 md:py-6 space-y-5">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 min-h-[44px] px-2.5 py-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-slate-900"
          aria-label="Back to results"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Results</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">·</span>
        <span className="text-xs text-slate-500 font-medium truncate">
          Car Park Detail
        </span>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-7 space-y-6">
        
        {/* Header: Title, Badge, Distance */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              {carpark.name}
            </h1>
            {carpark.badge && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                  carpark.badge === 'Best value'
                    ? 'bg-emerald-100 text-emerald-800'
                    : carpark.badge === 'Cheapest'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {carpark.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{carpark.distanceMeters < 1000 ? `${carpark.distanceMeters}m from destination` : `${carpark.distanceKm}km from destination`}</span>
            {carpark.agency && (
              <>
                <span aria-hidden="true">·</span>
                <span>Agency: {carpark.agency}</span>
              </>
            )}
          </div>
        </div>

        {/* Live Availability Section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  carpark.availableLots > 20
                    ? 'bg-emerald-500'
                    : carpark.availableLots > 0
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {carpark.availableLots > 0
                  ? `${carpark.availableLots} car lots available`
                  : 'Full / No lots available'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pl-4.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Last updated: {carpark.lastUpdated}</span>
            </p>
          </div>
        </div>

        {/* Cost Estimation & Breakdown */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Estimated Cost ({searchParams.durationHours}h stay)
          </h2>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {carpark.estimatedCost !== null
                  ? `$${carpark.estimatedCost.toFixed(2)}`
                  : 'Rate unavailable'}
              </span>
              <span className="text-xs text-emerald-900 font-medium">
                {searchParams.arrivalTime} · {searchParams.dateLabel}
              </span>
            </div>

            {/* Cost Breakdown */}
            <div className="pt-2 border-t border-emerald-200/80">
              <p className="text-xs font-semibold text-slate-700">Cost Breakdown:</p>
              <p className="text-xs font-mono text-emerald-950 mt-1 bg-white/80 py-1.5 px-2.5 rounded-lg border border-emerald-200/60 tabular-nums">
                {carpark.costBreakdown}
              </p>
              {carpark.isApproximateRate && (
                <p className="text-[11px] text-slate-500 mt-1">
                  * Approximate estimate based on standard rate bands.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Published Rate Text (Shown here only) */}
        <div className="space-y-2 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Published Rates</span>
          </h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
            {carpark.publishedRateText ? (
              <p className="font-mono text-[11px] text-slate-800 whitespace-pre-line">
                {carpark.publishedRateText}
              </p>
            ) : (
              <p className="text-slate-500 italic">
                Official published rate text is not listed for this car park. Please refer to entrance signage.
              </p>
            )}
          </div>
        </div>

        {/* EV Chargers Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-700" />
              <span>EV Chargers</span>
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {carpark.evChargers.length > 0 ? `${carpark.evChargers.length} installed` : 'None'}
            </span>
          </div>

          {carpark.evChargers.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {carpark.evChargers.map((ev) => (
                <div key={ev.id} className="p-3.5 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{ev.operator}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {ev.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block">Plug</span>
                      <span className="font-medium text-slate-800">{ev.plugType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Power</span>
                      <span className="font-medium text-slate-800">{ev.powerKW}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Price</span>
                      <span className="font-medium font-mono text-slate-800">{ev.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              No verified EV charging points installed directly at this car park.
            </div>
          )}
        </div>

        {/* Accessible Lots Section */}
        <div className="space-y-2 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Accessibility className="w-3.5 h-3.5 text-sky-700" />
            <span>Accessible Lots</span>
          </h2>
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Please check on arrival</p>
              <p className="text-[11px] text-sky-900 mt-0.5">
                Public live databases do not currently track accessible lot vacancy in real time. Car parks are required by BCA accessibility codes to provide designated lots near passenger lifts.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Button: "Get directions" (opens Google Maps) */}
        <div className="pt-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <Navigation className="w-4 h-4" />
            <span>Get directions</span>
          </a>
        </div>

      </div>
    </div>
  );
}
