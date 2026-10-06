import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, SearchParams } from '../types/index.ts';

interface MapViewProps {
  searchParams: SearchParams;
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  className?: string;
}

export default function MapView({
  searchParams,
  carparks,
  selectedCarpark,
  onSelectCarpark,
  className = 'h-full w-full'
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [searchParams.latitude, searchParams.longitude],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Destination Marker
    const destIcon = L.divIcon({
      className: 'dest-marker-wrapper',
      html: `
        <div style="background-color: #0f172a; color: white; border-radius: 9999px; padding: 6px 10px; font-weight: 700; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
          <span>📍</span>
          <span>Destination</span>
        </div>
      `,
      iconSize: [90, 32],
      iconAnchor: [45, 16]
    });

    const destMarker = L.marker([searchParams.latitude, searchParams.longitude], {
      icon: destIcon,
      zIndexOffset: 1000
    });
    destMarker.bindPopup(`<strong>${searchParams.destinationName}</strong><br/>Your destination`);
    destMarker.addTo(layer);

    // 2. Carpark Markers
    const bounds = L.latLngBounds([
      [searchParams.latitude, searchParams.longitude]
    ]);

    carparks.forEach((cp) => {
      bounds.extend([cp.latitude, cp.longitude]);
      const isSelected = selectedCarpark?.id === cp.id;

      const bgColor = isSelected ? '#047857' : '#1e293b';
      const border = isSelected ? '3px solid #34d399' : '2px solid white';
      const costText = cp.estimatedCost !== null ? `$${cp.estimatedCost.toFixed(2)}` : 'Rate unavail';

      const icon = L.divIcon({
        className: `carpark-marker-${cp.id}`,
        html: `
          <div style="background-color: ${bgColor}; color: white; border-radius: 8px; padding: 4px 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 600; box-shadow: 0 4px 8px rgba(0,0,0,0.25); border: ${border}; text-align: center; cursor: pointer; transition: transform 0.15s ease;">
            <div style="font-size: 12px; font-weight: 700;">${costText}</div>
            <div style="font-size: 9px; opacity: 0.9; color: #a7f3d0;">${cp.availableLots} lots</div>
          </div>
        `,
        iconSize: [84, 40],
        iconAnchor: [42, 20]
      });

      const marker = L.marker([cp.latitude, cp.longitude], {
        icon,
        zIndexOffset: isSelected ? 900 : 500
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong>${cp.name}</strong><br/>
          <span>${cp.distanceMeters}m away · ${cp.availableLots} car lots</span><br/>
          <span>Estimated: <strong>${costText}</strong></span>
        </div>
      `);

      marker.addTo(layer);
    });

    if (carparks.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    } else {
      map.setView([searchParams.latitude, searchParams.longitude], 16);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [searchParams, carparks, selectedCarpark, onSelectCarpark]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-10" />
    </div>
  );
}
