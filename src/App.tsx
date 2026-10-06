import { useState, useCallback } from 'react';
import Header from './components/Header.tsx';
import ScreenSearch from './components/ScreenSearch.tsx';
import ScreenResults from './components/ScreenResults.tsx';
import ScreenDetail from './components/ScreenDetail.tsx';
import { Carpark, SearchParams } from './types/index.ts';
import { getFallbackCarparks } from './data/fallbackSnapshot.ts';

type ScreenState = 'search' | 'results' | 'detail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('search');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  // Fetch carparks from backend API
  const fetchCarparks = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setIsError(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `/api/carparks?lat=${params.latitude}&lng=${params.longitude}&date=${encodeURIComponent(params.dateStr)}&time=${encodeURIComponent(params.arrivalTime)}&duration=${params.durationHours}&ev=${params.needEV ? '1' : '0'}`;
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.carparks)) {
        setCarparks(data.carparks);
        setIsFallback(Boolean(data.isFallback));
      } else {
        throw new Error('Invalid carparks response format');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('API error or timeout, loading saved snapshot for resilience:', err.message);
      
      // Fallback resilience: Marina Bay Sands saved snapshot
      const fallbackList = getFallbackCarparks(
        params.latitude,
        params.longitude,
        params.dateStr,
        params.arrivalTime,
        params.durationHours
      );
      
      const filteredFallback = params.needEV
        ? fallbackList.filter(c => c.evChargers.length > 0)
        : fallbackList;

      setCarparks(filteredFallback);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler when user triggers search from Screen 1
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setCurrentScreen('results');
    fetchCarparks(params);
  };

  // Quick EV filter toggle on Screen 2 summary bar
  const handleToggleEV = () => {
    if (!searchParams) return;
    const updated: SearchParams = {
      ...searchParams,
      needEV: !searchParams.needEV
    };
    setSearchParams(updated);
    fetchCarparks(updated);
  };

  // Quick Accessible filter toggle on Screen 2 summary bar
  const handleToggleAccessible = () => {
    if (!searchParams) return;
    const updated: SearchParams = {
      ...searchParams,
      needAccessible: !searchParams.needAccessible
    };
    setSearchParams(updated);
    localStorage.setItem('parksmart_pref_accessible', String(updated.needAccessible));
  };

  // Retry action for resilience
  const handleRetry = () => {
    if (searchParams) {
      fetchCarparks(searchParams);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header: "ParkSmart SG" logo only. No tabs. */}
      <Header
        onLogoClick={() => {
          setCurrentScreen('search');
          setSelectedCarpark(null);
        }}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'search' && (
          <ScreenSearch
            onSearch={handleSearch}
            initialParams={searchParams || undefined}
          />
        )}

        {currentScreen === 'results' && searchParams && (
          <ScreenResults
            searchParams={searchParams}
            carparks={carparks}
            isLoading={isLoading}
            isError={isError}
            isFallback={isFallback}
            onEditSearch={() => setCurrentScreen('search')}
            onSelectCarpark={(cp) => {
              setSelectedCarpark(cp);
              setCurrentScreen('detail');
            }}
            onToggleEV={handleToggleEV}
            onToggleAccessible={handleToggleAccessible}
            onRetry={handleRetry}
          />
        )}

        {currentScreen === 'detail' && selectedCarpark && searchParams && (
          <ScreenDetail
            carpark={selectedCarpark}
            searchParams={searchParams}
            onBack={() => setCurrentScreen('results')}
          />
        )}
      </main>
    </div>
  );
}
