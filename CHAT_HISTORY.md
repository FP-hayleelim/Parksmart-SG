# ParkSmart SG — Conversation & Development History

**Application**: ParkSmart SG  
**Description**: Singapore Real-Time Parking Finder & Tariff Estimation Engine  
**Date**: October 6, 2026 (SGT) / October 5, 2026 (UTC)  
**Repository**: `https://github.com/FP-hayleelim/Parksmart-SG.git`  
**Author**: FP-hayleelim (`haylee.lim@fairpricegroup.sg`)  

---

## 1. Initial Project Brief & Architecture Requirements

### 1.1 Goals
Build a modern, minimalist web app for Singapore drivers, EV drivers, and drivers requiring accessible lots to find car parks near their destination and estimate parking fees prior to travel.

### 1.2 UX Principles & Design System
- **Single decision per screen**:
  - **Screen 1 (Search)**: Clean destination search with autocomplete, "Near me" geolocation, date, 24-hour arrival time, duration chips (`1h`, `2h`, `3h`, `4h`, `More`), and preferences for `[⚡ EV charging]` & `[♿ Accessible lot]` saved to device.
  - **Screen 2 (Results)**: Summary bar with "Edit", filter chips, mobile List/Map toggle, desktop side-by-side view, top 3 car parks + "Show more", badges (`Best value`, `Cheapest`, `Nearest`), and standard disclaimer.
  - **Screen 3 (Detail)**: Full tariff breakdown, published schedule, live lots vacancy, EV charger specs (operator, plug types, power kW, status, pricing), accessible guidance, and "Get directions" link to Google Maps.
- **Strict Anti-Slop Rules**: Zero static badge sandwiches, clean unboxed typography with `·` separators, >= 44px tap targets, WCAG 2.1 AA contrast.

### 1.3 Technical Architecture
- **Frontend**: React SPA on Vite, Tailwind CSS, Leaflet + OpenStreetMap tiles (no Google Maps API key required).
- **Backend / Serverless**:
  - Node.js / Express in `server.ts` mounting Vite in development.
  - Serverless functions structured in `/api` (project root level) for seamless Vercel / serverless hosting.
  - LTA DataMall `AccountKey` kept strictly server-side in `process.env.LTA_ACCOUNT_KEY` (never exposed to client).

---

## 2. Iteration Log

### Iteration 1: Core Engine & Initial Implementation
1. **Bundled Tariff Rules**: Pre-parsed data.gov.sg tariff definitions with rules for daytime/evening time-band splits, "or part thereof" rounding up to next block, flat hourly, per minute, and per-entry rates.
2. **OneMap Search & Geolocation**: Integrated public OneMap Search API and browser geolocation.
3. **LTA DataMall CarParkAvailabilityv2 & EV Chargers**:
   - Filtered LotType "C" (cars).
   - Haversine straight-line distance calculations.
   - 60-second in-memory caching.
   - Linked EV chargers within 100 meters of car park.
4. **Resilience**: Safe error handling and graceful fallbacks.

---

### Iteration 2: Serverless Functions in `/api` (Root Level)
**User Request**:
> "add a serverless connection that pulls LTA data using the following endpoints :
> store this in /api folder (at project root level) NOT src file
> include /health.ts and /sora.ts within the same subfolder
> do not hardcode any api keys, i will include them manually
> # Live carpark lots (HDB + LTA + URA):
> https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
> # All requests need the header: AccountKey: <LTA_ACCOUNT_KEY>"

**Implementation**:
- Created `/api/health.ts` for monitoring system health and verifying `LTA_ACCOUNT_KEY` detection.
- Created `/api/sora.ts` connecting directly to `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2` with `AccountKey` header.
- Mounted routes in `server.ts`.

---

### Iteration 3: Renaming to `/api/parksmart.ts` & First GitHub Push
**User Requests**:
1. > "Remove SORA, is not reqiured"
2. > "sorry not remove but rename it to parksmart please"
3. > "git push https://...@[https://github.com/FP-hayleelim/Parksmart-SG.git]"

**Implementation**:
- Renamed `/api/sora.ts` to `/api/parksmart.ts`.
- Updated `/api/health.ts` and `server.ts` route mappings to `/api/parksmart`.
- Staged, committed, and pushed changes to `main` branch on GitHub:
  ```bash
  commit 5766da7: feat(api): add parksmart and health serverless endpoints
  ```

---

### Iteration 4: Island-Wide Singapore Expansion & Zero MBS Hardcoding
**User Request**:
> "Update the existing ParkSmart SG app so it works for any destination in Singapore, not only Marina Bay Sands. Do not change the UI, layout or other features.
> 1. Remove anything hard-coded to Marina Bay Sands: default destination, mock car park data, saved snapshot and example text. Leave the destination field empty with the placeholder 'Search any place in Singapore'.
> 2. Destination search: use the OneMap Search API so users can search any Singapore address, building, postal code or landmark. Keep 'Near me' using browser geolocation.
> 3. Car parks: fetch live data island-wide from LTA DataMall Carpark Availability (through the existing server-side proxy; the key stays in process.env.LTA_ACCOUNT_KEY). Show car lots (LotType 'C') within 1 km of the chosen destination.
> 4. Rates: for car parks without a matching rate in the dataset, show 'Rate unavailable' instead of hiding them or guessing a price.
> 5. If no car parks are found within 1 km, show 'No car parks within 1 km' with a button 'Search within 2 km'."

**Implementation**:
- **Clean Input**: Removed all Marina Bay Sands placeholders, defaults, and mock snapshots. Set placeholder to `"Search any place in Singapore"`.
- **Deleted `fallbackSnapshot.ts`**: Extracted sorting and badge ranking to `src/utils/sorter.ts`.
- **Island-wide Live LTA Data**: `/api/carparks.ts` processes all live lots island-wide within the specified radius.
- **"Rate unavailable"**: Unmatched car parks display `"Rate unavailable"` rather than being omitted or estimated.
- **Search within 2 km**: Added empty-state CTA `"Search within 2 km"` which expands search radius from 1,000m to 2,000m and updates live results.
- Committed to Git:
  ```bash
  commit 36d67f3: feat: enable island-wide Singapore search with OneMap and LTA DataMall, remove MBS defaults, add 2km expansion
  ```

---

### Iteration 5: Direct OneMap Search & Final Push
**User Requests**:
1. > "6. OneMap Search needs no API key. Call it directly; do not add a token."
2. > "git push https://...@[https://github.com/FP-hayleelim/Parksmart-SG.git]"

**Implementation**:
- Built `src/services/onemap.ts` to query OneMap's public Search API directly from the client without any token or API key headers.
- `/api/geocode.ts` on the backend also calls OneMap directly without tokens.
- Pushed all updates to GitHub repository:
  ```bash
  commit 85a43e5: feat: call OneMap Search directly without tokens or API keys
  ```

---

## 3. Current Directory & API Structure

```
├── api/
│   ├── carparks.ts      # Live LTA availability, distance filtering, tariff calculation
│   ├── ev.ts            # LTA DataMall EV charging point proxy
│   ├── geocode.ts       # OneMap search & reverse geocode proxy
│   ├── health.ts        # Health status & environment key verification
│   └── parksmart.ts     # Dedicated raw LTA CarParkAvailabilityv2 serverless handler
├── src/
│   ├── components/
│   │   ├── Header.tsx           # ParkSmart SG brand header
│   │   ├── MapView.tsx          # Leaflet OpenStreetMap interactive view
│   │   ├── ScreenSearch.tsx     # Screen 1: Search, Near me, filters
│   │   ├── ScreenResults.tsx    # Screen 2: Ranked list & map view, 2km search
│   │   └── ScreenDetail.tsx     # Screen 3: Rate breakdown & Google Maps directions
│   ├── data/
│   │   └── carparkRates.ts      # Bundled LTA / data.gov.sg rate database
│   ├── services/
│   │   └── onemap.ts            # Direct client OneMap Search service (no tokens)
│   ├── types/
│   │   └── index.ts             # Data models & interfaces
│   ├── utils/
│   │   ├── geo.ts               # Haversine distance calculations
│   │   ├── rateCalculator.ts    # Billing calculation engine
│   │   └── sorter.ts            # Best value, cheapest, and nearest badge assigner
│   ├── App.tsx                  # Main application router
│   ├── index.css                # Tailwind CSS & Leaflet custom styling
│   └── main.tsx                 # React entry point
├── .env.example                 # Placeholder for LTA_ACCOUNT_KEY
├── package.json
├── server.ts                    # Full-stack server entry point (Express + Vite)
└── CHAT_HISTORY.md              # Full conversation and development archive
```

---

## 4. Environment Variables

| Variable | Description | Exposure |
|---|---|---|
| `LTA_ACCOUNT_KEY` | LTA DataMall account access key | Server-side only (never sent to client) |
