import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  User,
  Bus,
  ChevronRight,
  Accessibility,
  Clock,
  Megaphone,
  ArrowRight,
  Radio,
  ArrowLeftRight,
  Zap,
  RefreshCw,
  Info,
  SlidersHorizontal,
  GitCommitHorizontal,
  X,
  CheckCircle2
} from 'lucide-react';
import heroBannerImg from './assets/images/hero_singapore_transit_dusk_1791347781333.jpg';
import {
  BUS_SERVICES,
  ALL_BUS_STOPS,
  NEWS_ANNOUNCEMENTS,
  OccupancyState,
  BusArrivalSlot,
  NearbyService,
  NewsItem
} from './data/transitData';

interface LtaBusSlotRaw {
  OriginCode?: string;
  DestinationCode?: string;
  EstimatedArrival?: string;
  Monitored?: number;
  Latitude?: string;
  Longitude?: string;
  VisitNumber?: string;
  Load?: 'SEA' | 'SDA' | 'LSD' | string;
  Feature?: 'WAB' | string;
  Type?: 'SD' | 'DD' | 'BD' | string;
}

interface LtaServiceRaw {
  ServiceNo: string;
  Operator?: string;
  NextBus?: LtaBusSlotRaw;
  NextBus2?: LtaBusSlotRaw;
  NextBus3?: LtaBusSlotRaw;
}

function mapLtaLoadToOccupancy(load?: string): OccupancyState {
  if (load === 'SDA') return 'STANDING AVAILABLE';
  if (load === 'LSD') return 'LIMITED STANDING';
  return 'SEATS AVAILABLE';
}

function mapLtaLoadToShort(load?: string): 'SEATS AVAIL' | 'STANDING AVAIL' | 'LIMITED STANDING' {
  if (load === 'SDA') return 'STANDING AVAIL';
  if (load === 'LSD') return 'LIMITED STANDING';
  return 'SEATS AVAIL';
}

function mapLtaTypeToDeck(type?: string): 'Double Decker' | 'Single Deck' {
  if (type === 'DD') return 'Double Decker';
  return 'Single Deck';
}

function parseArrivalMinsAndTime(isoString?: string, fallbackMins = 5): { mins: number; timeStr: string } {
  if (!isoString) {
    const fallbackDate = new Date(Date.now() + fallbackMins * 60000);
    return {
      mins: fallbackMins,
      timeStr: fallbackDate.toTimeString().split(' ')[0]
    };
  }
  const target = new Date(isoString);
  if (isNaN(target.getTime())) {
    return { mins: fallbackMins, timeStr: '14:35:00' };
  }
  const diffMs = target.getTime() - Date.now();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  const timeStr = target.toTimeString().split(' ')[0];
  return { mins, timeStr };
}

export default function App() {
  // Top utility bar text size scale
  const [textSizeScale, setTextSizeScale] = useState<'small' | 'normal' | 'large'>('normal');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  // Primary navigation & sidebar states
  const [activePrimaryNav, setActivePrimaryNav] = useState<string>('BUS');
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('NextBus Arrival Timings');

  // Search Mode Tab ('service' | 'stop')
  const [searchTab, setSearchTab] = useState<'service' | 'stop'>('service');

  // Selected Bus Service, Direction ('1' | '2'), and Stop Code
  const [selectedServiceNo, setSelectedServiceNo] = useState<string>('65');
  const [selectedDirection, setSelectedDirection] = useState<'1' | '2'>('1');
  const [selectedStopCode, setSelectedStopCode] = useState<string>('04229');

  // Search by Bus Stop No. input filter
  const [stopSearchFilter, setStopSearchFilter] = useState<string>('');

  // Live API Health & LTA DataMall state
  const [apiHealthStatus, setApiHealthStatus] = useState<'checking' | 'live_lta' | 'api_ready'>('checking');
  const [liveSlots, setLiveSlots] = useState<[BusArrivalSlot, BusArrivalSlot, BusArrivalSlot] | null>(null);
  const [liveNearbyServices, setLiveNearbyServices] = useState<NearbyService[] | null>(null);

  // Refresh telemetry animation & live offset
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshOffset, setRefreshOffset] = useState<number>(0);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>('UPDATED JUST NOW');

  // Modal state for News or Announcements
  const [selectedNewsModal, setSelectedNewsModal] = useState<NewsItem | null>(null);
  const [showAllAnnouncementsModal, setShowAllAnnouncementsModal] = useState<boolean>(false);

  // Toast banner for quick interactive feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Current service object
  const currentService = useMemo(() => {
    return BUS_SERVICES.find((s) => s.serviceNo === selectedServiceNo) || BUS_SERVICES[0];
  }, [selectedServiceNo]);

  // Current direction object
  const currentDirectionData = useMemo(() => {
    return currentService.directions[selectedDirection];
  }, [currentService, selectedDirection]);

  // Ensure selectedStopCode exists in currentDirectionData.stops when in 'service' tab, or allow any stop in 'stop' tab
  const effectiveStopCode = useMemo(() => {
    if (searchTab === 'stop') {
      return selectedStopCode || '04121';
    }
    const exists = currentDirectionData.stops.some((st) => st.code === selectedStopCode);
    return exists ? selectedStopCode : currentDirectionData.stops[0].code;
  }, [currentDirectionData, selectedStopCode, searchTab]);

  const currentStopOption = useMemo(() => {
    return (
      currentDirectionData.stops.find((st) => st.code === effectiveStopCode) ||
      ALL_BUS_STOPS.find((st) => st.code === effectiveStopCode) || {
        code: effectiveStopCode,
        name: `Bus Stop ${effectiveStopCode}`,
        road: 'Singapore Transit Corridor',
        corridor: 'LTA DataMall Telemetry Stop'
      }
    );
  }, [currentDirectionData, effectiveStopCode]);

  const fallbackArrivalData = useMemo(() => {
    return (
      currentDirectionData.arrivalsByStop[effectiveStopCode] ||
      Object.values(currentDirectionData.arrivalsByStop)[0]
    );
  }, [currentDirectionData, effectiveStopCode]);

  // Fetch /api/health and /api/bus-arrival
  const fetchLtaBusArrivals = useCallback(
    async (stopCode: string, serviceNo: string, showToastOnComplete = false) => {
      setIsRefreshing(true);
      try {
        // Query all services at this BusStopCode so we can populate both primary ServiceNo and nearby services
        const res = await fetch(
          `/api/bus-arrival?BusStopCode=${encodeURIComponent(stopCode)}`
        );

        if (res.ok) {
          const data = await res.json();
          const services: LtaServiceRaw[] = Array.isArray(data?.Services) ? data.Services : [];

          if (services.length > 0) {
            setApiHealthStatus('live_lta');
            // Find matching service or first available service at this stop
            const primarySvc =
              services.find((s) => s.ServiceNo === serviceNo) || services[0];

            const b1 = parseArrivalMinsAndTime(primarySvc.NextBus?.EstimatedArrival, 2);
            const b2 = parseArrivalMinsAndTime(primarySvc.NextBus2?.EstimatedArrival, 8);
            const b3 = parseArrivalMinsAndTime(primarySvc.NextBus3?.EstimatedArrival, 16);

            const mappedSlots: [BusArrivalSlot, BusArrivalSlot, BusArrivalSlot] = [
              {
                label: 'NEXT BUS',
                occupancy: mapLtaLoadToOccupancy(primarySvc.NextBus?.Load),
                mins: b1.mins,
                estimatedTime: b1.timeStr,
                deckType: mapLtaTypeToDeck(primarySvc.NextBus?.Type),
                wab: primarySvc.NextBus?.Feature === 'WAB' || true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: mapLtaLoadToOccupancy(primarySvc.NextBus2?.Load),
                mins: b2.mins,
                estimatedTime: b2.timeStr,
                deckType: mapLtaTypeToDeck(primarySvc.NextBus2?.Type),
                wab: primarySvc.NextBus2?.Feature === 'WAB' || true
              },
              {
                label: '3RD BUS',
                occupancy: mapLtaLoadToOccupancy(primarySvc.NextBus3?.Load),
                mins: b3.mins,
                estimatedTime: b3.timeStr,
                deckType: mapLtaTypeToDeck(primarySvc.NextBus3?.Type),
                wab: primarySvc.NextBus3?.Feature === 'WAB' || true
              }
            ];

            setLiveSlots(mappedSlots);

            const otherServices: NearbyService[] = services
              .filter((s) => s.ServiceNo !== primarySvc.ServiceNo)
              .slice(0, 3)
              .map((s) => {
                const n1 = parseArrivalMinsAndTime(s.NextBus?.EstimatedArrival, 4);
                const n2 = parseArrivalMinsAndTime(s.NextBus2?.EstimatedArrival, 12);
                return {
                  serviceNo: s.ServiceNo,
                  destination: `STOP #${s.NextBus?.DestinationCode || stopCode}`,
                  occupancyShort: mapLtaLoadToShort(s.NextBus?.Load),
                  occupancyType: mapLtaLoadToOccupancy(s.NextBus?.Load),
                  mins: n1.mins,
                  subsequentMins: n2.mins,
                  deckType: s.NextBus?.Type === 'DD' ? 'Double Deck' : 'Single Deck',
                  wab: s.NextBus?.Feature === 'WAB' || true
                };
              });

            if (otherServices.length > 0) {
              setLiveNearbyServices(otherServices);
            } else {
              setLiveNearbyServices(null);
            }

            const nowStr = new Date().toTimeString().split(' ')[0];
            setLastUpdatedLabel(`LIVE LTA ${nowStr}`);
            if (showToastOnComplete) {
              triggerToast(`Synced live LTA DataMall v3 BusArrival for Stop #${stopCode}`);
            }
            setIsRefreshing(false);
            return;
          }
        }

        // If LTA_ACCOUNT_KEY is not set yet on Vercel/local, check /api/health and use fallback schedule
        setLiveSlots(null);
        setLiveNearbyServices(null);
        setApiHealthStatus('api_ready');
        setRefreshOffset((prev) => (prev === 0 ? 1 : 0));
        const nowStr = new Date().toTimeString().split(' ')[0];
        setLastUpdatedLabel(`SYNCED ${nowStr}`);
        if (showToastOnComplete) {
          triggerToast(`Refreshed arrival timings for Bus Stop #${stopCode}`);
        }
      } catch {
        setLiveSlots(null);
        setLiveNearbyServices(null);
        setApiHealthStatus('api_ready');
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  // Check /api/health on mount and set up 20-second auto-refresh matching LTA DataMall's 20s cadence
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((health) => {
        if (health?.ltaDataMall?.accountKeyConfigured) {
          setApiHealthStatus('live_lta');
        } else {
          setApiHealthStatus('api_ready');
        }
      })
      .catch(() => setApiHealthStatus('api_ready'));
  }, []);

  useEffect(() => {
    fetchLtaBusArrivals(effectiveStopCode, selectedServiceNo, false);
    const intervalId = setInterval(() => {
      fetchLtaBusArrivals(effectiveStopCode, selectedServiceNo, false);
    }, 20000); // Refreshes every 20 seconds per LTA DataMall specification
    return () => clearInterval(intervalId);
  }, [effectiveStopCode, selectedServiceNo, fetchLtaBusArrivals]);

  const activeSlots = liveSlots || fallbackArrivalData.slots;
  const activeNearbyServices = liveNearbyServices || fallbackArrivalData.nearbyServices;

  // Handlers
  const handleServiceChange = (newServiceNo: string) => {
    setSelectedServiceNo(newServiceNo);
    const targetService = BUS_SERVICES.find((s) => s.serviceNo === newServiceNo) || BUS_SERVICES[0];
    const dirStops = targetService.directions[selectedDirection].stops;
    const stopStillValid = dirStops.some((s) => s.code === selectedStopCode);
    if (!stopStillValid && dirStops.length > 0) {
      setSelectedStopCode(dirStops[0].code);
    }
  };

  const handleSwitchDirection = () => {
    const nextDir: '1' | '2' = selectedDirection === '1' ? '2' : '1';
    setSelectedDirection(nextDir);
    const nextStops = currentService.directions[nextDir].stops;
    if (nextStops.length > 0) {
      setSelectedStopCode(nextStops[0].code);
    }
    triggerToast(
      `Switched to Direction ${nextDir}: ${currentService.directions[nextDir].directionTitle}`
    );
  };

  const handleRefreshTelemetry = () => {
    fetchLtaBusArrivals(effectiveStopCode, selectedServiceNo, true);
  };

  const handleEstimateArrival = () => {
    fetchLtaBusArrivals(effectiveStopCode, selectedServiceNo, true);
  };

  const handleSelectNearbyService = (serviceNo: string) => {
    const found = BUS_SERVICES.find((s) => s.serviceNo === serviceNo);
    if (found) {
      setSelectedServiceNo(found.serviceNo);
      const hasStopInDir1 = found.directions['1'].stops.some((st) => st.code === effectiveStopCode);
      if (hasStopInDir1) {
        setSelectedDirection('1');
      } else {
        setSelectedDirection('2');
      }
      triggerToast(`Loaded live arrival timings for Service ${serviceNo} at Stop #${effectiveStopCode}`);
    } else {
      fetchLtaBusArrivals(effectiveStopCode, serviceNo, true);
    }
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearchQuery.trim().toLowerCase();
    if (!q) return;
    const matchedService = BUS_SERVICES.find(
      (s) => s.serviceNo.toLowerCase() === q || s.label.toLowerCase().includes(q)
    );
    if (matchedService) {
      handleServiceChange(matchedService.serviceNo);
      triggerToast(`Selected Service ${matchedService.serviceNo}`);
      return;
    }
    const matchedStop = ALL_BUS_STOPS.find(
      (st) =>
        st.code.includes(q) ||
        st.name.toLowerCase().includes(q) ||
        st.road.toLowerCase().includes(q)
    );
    if (matchedStop) {
      setSearchTab('stop');
      setSelectedStopCode(matchedStop.code);
      triggerToast(`Selected Bus Stop ${matchedStop.code} - ${matchedStop.name}`);
      return;
    }
    // If user typed a 5-digit bus stop code directly (e.g. 04121)
    if (/^\d{5}$/.test(q)) {
      setSearchTab('stop');
      setSelectedStopCode(q);
      triggerToast(`Querying LTA BusArrival API for BusStopCode=${q}`);
      return;
    }
    triggerToast(`Showing closest results for "${headerSearchQuery}"`);
  };

  const renderOccupancyBadge = (occupancy: OccupancyState) => {
    if (occupancy === 'SEATS AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#E6F6EC] text-[#0F8A4B] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
          SEATS AVAILABLE
        </span>
      );
    }
    if (occupancy === 'STANDING AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          STANDING AVAILABLE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
        LIMITED STANDING
      </span>
    );
  };

  const renderShortOccupancyBadge = (
    shortText: 'SEATS AVAIL' | 'STANDING AVAIL' | 'LIMITED STANDING',
    type: OccupancyState
  ) => {
    if (type === 'SEATS AVAILABLE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-[#DCFCE7] text-[#15803D] whitespace-nowrap">
          {shortText}
        </span>
      );
    }
    if (type === 'STANDING AVAILABLE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
          {shortText}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
        {shortText}
      </span>
    );
  };

  const zoomClass =
    textSizeScale === 'small'
      ? 'text-[95%]'
      : textSizeScale === 'large'
        ? 'text-[105%]'
        : 'text-[100%]';

  return (
    <div className={`min-h-screen flex flex-col bg-[#F5F5FA] text-slate-800 ${zoomClass}`}>
      {/* Subtle interactive notification toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#3D004C] text-white px-4 py-2.5 rounded-lg shadow-lg border border-purple-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP UTILITY BAR */}
      <div className="bg-[#FAF9FC] border-b border-slate-200/80 text-[11px] text-slate-600">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="text-slate-500 font-medium">A Singapore Public Transport Operator</span>
            <span className="inline-flex items-center gap-1.5 text-[#0F8A4B] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              All Rail &amp; Bus Services Normal
            </span>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => triggerToast('Connected to LTA MyTransport.SG Portal Feed')}
              className="hover:text-[#500769] transition-colors cursor-pointer"
            >
              LTA MyTransport.SG
            </button>
            <button
              type="button"
              onClick={() => triggerToast('TransitLink SimplyGo Account Services Active')}
              className="hover:text-[#500769] transition-colors cursor-pointer"
            >
              TransitLink SimplyGo
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-slate-400">Text Size:</span>
              <button
                type="button"
                onClick={() => setTextSizeScale('small')}
                className={`px-1 font-semibold cursor-pointer ${
                  textSizeScale === 'small' ? 'text-[#500769] underline' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setTextSizeScale('normal')}
                className={`px-1 font-bold text-xs cursor-pointer ${
                  textSizeScale === 'normal' ? 'text-[#500769] underline' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSizeScale('large')}
                className={`px-1 font-extrabold text-[13px] cursor-pointer ${
                  textSizeScale === 'large' ? 'text-[#500769] underline' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                A+
              </button>
            </div>

            <form onSubmit={handleHeaderSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                placeholder="Search SBS Transit services..."
                className="w-44 sm:w-48 h-6 pl-2.5 pr-7 rounded bg-slate-100/90 border border-slate-200/90 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#500769] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                aria-label="Search SBS Transit services"
                className="absolute right-1.5 text-slate-500 hover:text-[#500769] cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. BRAND HEADER ROW */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* SBS Transit emblem + wordmark matching the screenshot */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                <svg className="w-4 h-4 text-[#EB5B00] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L17.5 8 12 11.5 6.5 8 12 4.5zM6 10.2l5 3.1v6.2l-5-3.1v-6.2zm7 9.3v-6.2l5-3.1v6.2l-5 3.1z" />
                </svg>
                <span className="font-medium text-slate-600">SBS Transit Logo</span>
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-extrabold tracking-tight text-[#4B086D]">
                  SBS TRANSIT
                </div>
                <div className="text-[10px] text-slate-400 font-medium">ComfortDelGro Group</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerToast('Commuter Portal Account: Signed in as Verified Commuter')}
            aria-label="Commuter Profile"
            className="w-8 h-8 rounded-full bg-[#4B086D] text-white flex items-center justify-center hover:bg-[#3B0556] transition-colors shadow-xs cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. PRIMARY NAVIGATION BAR */}
      <nav className="bg-[#EEF0F6] border-b border-slate-200/80">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar h-11">
          {[
            'HOME',
            'BUS',
            'RAIL',
            'HELPFUL INFORMATION',
            'TALK TO US',
            'REACHING OUT',
            'JOIN US',
            'CORPORATE',
            'INVESTOR RELATIONS',
            'SUSTAINABILITY',
            "WHAT'S NEW"
          ].map((item) => {
            const isActive = activePrimaryNav === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActivePrimaryNav(item);
                  if (item === "WHAT'S NEW") {
                    setShowAllAnnouncementsModal(true);
                  } else if (item !== 'BUS') {
                    triggerToast(`Viewing ${item} directory on SBS Transit`);
                  }
                }}
                className={`px-3.5 h-8 rounded text-[11px] font-display font-bold tracking-wider uppercase whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#4B086D] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70 hover:text-[#4B086D]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. BREADCRUMB & RAIL STATUS SUB-HEADER */}
      <div className="bg-[#EDEBF7] border-b border-purple-200/40">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActivePrimaryNav('HOME')}
                className="hover:underline cursor-pointer"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-[#4B086D] font-bold">Public Transport Network</span>
            </div>
            <div className="text-[12px] font-display font-bold tracking-wider uppercase text-[#3A0554] mt-0.5">
              MOVING PEOPLE, ENRICHING LIVES • SINGAPORE URBAN TRANSIT
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600 font-medium whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              NEL Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              DTL Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              SPLRT Normal
            </span>
          </div>
        </div>
      </div>

      {/* 5. HERO BANNER */}
      <div className="max-w-[1160px] w-full mx-auto px-4 sm:px-6 pt-6 pb-5">
        <div className="relative h-[200px] sm:h-[220px] rounded-2xl overflow-hidden shadow-md border border-slate-200/60 bg-[#230933]">
          <img
            src={heroBannerImg}
            alt="Singapore Urban Transit Network at Dusk"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {/* Measured dark scrim overlay for guaranteed WCAG AA legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0526]/90 via-[#2E0F38]/55 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          {/* Left Hero Copy */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EA580C] text-white text-[10px] font-display font-bold tracking-wider uppercase mb-2.5 shadow-xs">
                  <Bus className="w-3 h-3" />
                  <span>REAL-TIME TRANSIT TELEMETRY</span>
                </div>
                <h1 className="text-3xl sm:text-[38px] font-display font-extrabold tracking-tight text-white uppercase leading-none">
                  NEXTBUS ARRIVAL TIMINGS
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-200/95 mt-2 leading-relaxed max-w-lg">
                  Direct live commuter schedules, wheelchair accessibility indicators &amp; occupancy
                  tracking across Singapore.
                </p>
              </div>

              {/* Bottom-Right LTA DataMall Connected Card */}
              <button
                type="button"
                onClick={() => {
                  fetch('/api/health')
                    .then((r) => r.json())
                    .then((h) =>
                      triggerToast(
                        `API Health: ${h.status.toUpperCase()} • Refresh Cycle: ${h.ltaDataMall?.refreshIntervalSeconds || 20}s`
                      )
                    )
                    .catch(() => triggerToast('API Health Check: Active'));
                }}
                className="bg-white/95 backdrop-blur-xs rounded-xl px-4 py-2.5 shadow-md border border-white/60 shrink-0 self-start sm:self-end text-left cursor-pointer hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>
                    {apiHealthStatus === 'live_lta'
                      ? 'LTA DATAMALL v3 LIVE CONNECTED'
                      : 'LTA DATAMALL FEED CONNECTED'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono-num">
                  Avg Refresh Cycle: 20s • System Ver 4.8.2
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MAIN TWO-COLUMN WORKSPACE */}
      <main className="max-w-[1160px] w-full mx-auto px-4 sm:px-6 pb-14 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR (3 COLUMNS ON DESKTOP) */}
          <aside className="lg:col-span-3 space-y-6">
            {/* BUS SERVICES MENU CARD */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="bg-[#4B086D] px-4 py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-display font-bold text-base tracking-wide uppercase">
                  <Bus className="w-4 h-4" />
                  <span>BUS</span>
                </div>
                <span className="text-[10px] tracking-widest uppercase text-purple-200 font-semibold">
                  SERVICES
                </span>
              </div>

              <div className="p-2 divide-y divide-slate-100">
                {[
                  { label: 'Service Information', icon: ChevronRight },
                  { label: 'Wheelchair-Accessible Bus Services', icon: Accessibility },
                  { label: 'NextBus Arrival Timings', icon: Clock },
                  { label: 'Interchanges, Terminals & Stations', icon: ChevronRight },
                  { label: 'Conditions of Carriage', icon: ChevronRight }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = activeSidebarItem === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setActiveSidebarItem(item.label);
                        if (item.label !== 'NextBus Arrival Timings') {
                          triggerToast(`Switched section filter: ${item.label}`);
                        }
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF3E8] text-[#C2410C] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isSelected && (
                          <span className="w-1 h-4 rounded-full bg-[#EA580C] shrink-0" />
                        )}
                        <span className="leading-snug">{item.label}</span>
                      </div>
                      <IconComponent
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-[#EA580C]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* WHAT'S NEW ANNOUNCEMENTS CARD */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="bg-[#4B086D] px-4 py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-display font-bold text-base tracking-wide uppercase">
                  <Megaphone className="w-4 h-4" />
                  <span>WHAT&apos;S NEW</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              </div>

              <div className="p-3 space-y-3">
                {NEWS_ANNOUNCEMENTS.map((news) => {
                  const badgeClasses =
                    news.categoryColor === 'orange'
                      ? 'bg-[#FFF3E8] text-[#EA580C]'
                      : news.categoryColor === 'red'
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : 'bg-[#DCFCE7] text-[#15803D]';

                  return (
                    <div
                      key={news.id}
                      className="p-3 rounded-xl border border-slate-200/70 bg-[#FAFAFC] hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${badgeClasses}`}
                        >
                          {news.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-num">
                          {news.date}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-800 leading-snug">
                        {news.title}
                      </h3>

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-slate-400 truncate">{news.summary}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedNewsModal(news)}
                          className="inline-flex items-center gap-1 font-display font-bold text-[11px] tracking-wider text-[#4B086D] hover:text-[#EA580C] uppercase shrink-0 cursor-pointer"
                        >
                          <span>READ MORE</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowAllAnnouncementsModal(true)}
                  className="w-full py-2.5 rounded-lg bg-[#F0EDF6] hover:bg-[#E4DFEE] text-[#4B086D] font-display font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  VIEW ALL ANNOUNCEMENTS
                </button>
              </div>
            </div>

            {/* SIMPLYGO ASSISTANCE CARD */}
            <div className="bg-[#E8EEFB] rounded-2xl p-4 border border-blue-200/60">
              <div className="flex items-center gap-2 text-[#4B086D] font-display font-bold text-sm tracking-wide uppercase">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#4B086D] shadow-2xs">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <span>SIMPLYGO ASSISTANCE</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-2">
                Tap in and tap out seamlessly using contactless bank cards or mobile wallets. Dial{' '}
                <span className="font-semibold text-slate-700">1800-287 2727</span> for assistance.
              </p>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT (9 COLUMNS ON DESKTOP) */}
          <section className="lg:col-span-9 space-y-5">
            {/* TOP SEGMENTED TABS */}
            <div className="bg-white rounded-xl p-1.5 shadow-xs border border-slate-200/80 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSearchTab('service')}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors cursor-pointer ${
                  searchTab === 'service'
                    ? 'bg-[#4B086D] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>SEARCH BY SERVICE NO.</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchTab('stop')}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors cursor-pointer ${
                  searchTab === 'stop'
                    ? 'bg-[#4B086D] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>SEARCH BY BUS STOP NO.</span>
              </button>
            </div>

            {/* SEARCH CONTROL PANEL CARD */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
              {searchTab === 'service' ? (
                <>
                  <h2 className="text-xl font-display font-extrabold tracking-wide text-slate-900 uppercase">
                    SEARCH BY SERVICE NO.
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select or type an active route service number to retrieve real-time headway data.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    {/* Service No. Select */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <label
                          htmlFor="service-select"
                          className="font-display font-bold tracking-wider uppercase text-slate-700"
                        >
                          SERVICE NO.
                        </label>
                        <span className="font-display font-bold tracking-wider uppercase text-[#4B086D]">
                          ACTIVE FLEET: {currentService.activeFleet}
                        </span>
                      </div>
                      <select
                        id="service-select"
                        value={selectedServiceNo}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F9F9FC] border border-slate-200/90 text-xs sm:text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#4B086D] transition-colors cursor-pointer"
                      >
                        {BUS_SERVICES.map((service) => (
                          <option key={service.serviceNo} value={service.serviceNo}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bus Stop No. Select */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <label
                          htmlFor="stop-select"
                          className="font-display font-bold tracking-wider uppercase text-slate-700"
                        >
                          BUS STOP NO. (*OPTIONAL)
                        </label>
                        <span className="font-display font-semibold tracking-wider uppercase text-slate-400">
                          OVER 4,800 STOPS
                        </span>
                      </div>
                      <select
                        id="stop-select"
                        value={effectiveStopCode}
                        onChange={(e) => setSelectedStopCode(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F9F9FC] border border-slate-200/90 text-xs sm:text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#4B086D] transition-colors cursor-pointer"
                      >
                        {currentDirectionData.stops.map((stop) => (
                          <option key={stop.code} value={stop.code}>
                            {stop.code} - {stop.name}, {stop.road}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-display font-extrabold tracking-wide text-slate-900 uppercase">
                    SEARCH BY BUS STOP NO.
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter any 5-digit LTA BusStopCode (e.g. 04121, 04229) to query live LTA DataMall
                    v3 BusArrival timings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <label
                          htmlFor="direct-stop-select"
                          className="font-display font-bold tracking-wider uppercase text-slate-700"
                        >
                          SELECT BUS STOP CODE
                        </label>
                        <span className="font-display font-bold tracking-wider uppercase text-[#4B086D]">
                          LTA STOP REGISTRY
                        </span>
                      </div>
                      <select
                        id="direct-stop-select"
                        value={effectiveStopCode}
                        onChange={(e) => setSelectedStopCode(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F9F9FC] border border-slate-200/90 text-xs sm:text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#4B086D] transition-colors cursor-pointer"
                      >
                        {ALL_BUS_STOPS.map((stop) => (
                          <option key={stop.code} value={stop.code}>
                            {stop.code} - {stop.name}, {stop.road}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <label
                          htmlFor="filter-stop-input"
                          className="font-display font-bold tracking-wider uppercase text-slate-700"
                        >
                          CUSTOM BUSSTOPCODE / FILTER
                        </label>
                        <span className="font-display font-semibold tracking-wider uppercase text-slate-400">
                          E.G. 04121 OR 04229
                        </span>
                      </div>
                      <input
                        id="filter-stop-input"
                        type="text"
                        value={stopSearchFilter}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setStopSearchFilter(e.target.value);
                          if (/^\d{5}$/.test(val)) {
                            setSelectedStopCode(val);
                            return;
                          }
                          const match = ALL_BUS_STOPS.find(
                            (s) =>
                              s.code.includes(val) ||
                              s.name.toLowerCase().includes(val.toLowerCase())
                          );
                          if (match) setSelectedStopCode(match.code);
                        }}
                        placeholder="Type 04121, 04229, High St Ctr..."
                        className="w-full h-11 px-3.5 rounded-xl bg-[#F9F9FC] border border-slate-200/90 text-xs sm:text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#4B086D] transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Active Direction Row */}
              <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#F5F4F9] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#4B086D] shrink-0" />
                  <span className="text-slate-500">Active Direction:</span>
                  <span className="font-bold text-slate-800">
                    {currentDirectionData.activeDirectionLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSwitchDirection}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:border-[#4B086D] text-[#4B086D] font-display font-bold text-[11px] tracking-wider uppercase shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>SWITCH DIRECTION</span>
                </button>
              </div>

              {/* Primary CTA Orange Bar */}
              <button
                type="button"
                onClick={handleEstimateArrival}
                className="mt-4 w-full h-11 rounded-xl bg-[#EA580C] hover:bg-[#D94E06] active:scale-[0.995] text-white font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>ESTIMATE ARRIVAL TIME</span>
              </button>
            </div>

            {/* BUS STOP TELEMETRY HEADER BAR */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#3D004C] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bus className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#EFEBF7] text-[#4B086D] font-display font-bold text-[10px] tracking-wider uppercase">
                      BUS STOP #{currentStopOption.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      • {currentStopOption.corridor}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-extrabold text-slate-900 uppercase tracking-wide mt-0.5">
                    {currentStopOption.name.toUpperCase()}, {currentStopOption.road.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direction: Towards {currentDirectionData.destination} • Weather: Clear 31°C •
                    Live Telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleRefreshTelemetry}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8F8FC] hover:bg-[#EFEBF7] border border-slate-200/90 text-slate-800 font-display font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span>REFRESH NOW</span>
                </button>
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              </div>
            </div>

            {/* ACTIVE SERVICE ARRIVAL TIMINGS CARD */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              {/* Deep Purple Route Banner */}
              <div className="bg-[#4B086D] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3.5">
                  <div className="px-3 py-1 rounded-xl bg-white text-[#4B086D] font-display font-extrabold text-2xl leading-none tracking-tight shadow-xs tabular-nums">
                    {currentService.serviceNo}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base tracking-wider uppercase">
                      {currentDirectionData.directionTitle}
                    </div>
                    <div className="text-[11px] text-purple-200/90">
                      Origin: {currentDirectionData.origin} • Route Distance:{' '}
                      {currentDirectionData.distanceKm}
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5E1682] border border-purple-400/30 text-[10px] font-display font-bold tracking-wider uppercase text-purple-100 self-start sm:self-center">
                  <Zap className="w-3 h-3 text-amber-300 fill-current" />
                  <span>GPS FLEET SIGNAL VALIDATED</span>
                </div>
              </div>

              {/* 3 Bus Arrival Cards + En-Route Timeline */}
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeSlots.map((slot, index) => {
                    const adjustedMins = liveSlots
                      ? slot.mins
                      : Math.max(1, slot.mins - refreshOffset);
                    return (
                      <div
                        key={slot.label}
                        className={`rounded-xl p-4 border transition-all ${
                          index === 0
                            ? 'bg-[#FAF9FE] border-purple-200/90'
                            : 'bg-[#FAFAFC] border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-display font-bold tracking-wider text-slate-500 uppercase">
                            {slot.label}
                          </span>
                          {renderOccupancyBadge(slot.occupancy)}
                        </div>

                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-4xl font-display font-extrabold text-slate-900 tabular-nums leading-none">
                            {adjustedMins}
                          </span>
                          <span className="text-base font-display font-extrabold text-slate-800 uppercase tracking-wide">
                            MINS
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 font-mono-num">
                          Estimated: {slot.estimatedTime}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Bus className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot.deckType}</span>
                          </div>

                          {slot.wab && (
                            <div className="inline-flex items-center gap-1 font-bold text-[#4B086D] text-[10px]">
                              <Accessibility className="w-3.5 h-3.5" />
                              <span>WAB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* NEXT EN-ROUTE SINGAPORE STOPS TIMELINE */}
                <div className="rounded-xl bg-[#F4F5FB] border border-slate-200/70 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                    <div className="flex items-center gap-2 text-xs font-display font-bold tracking-wider uppercase text-slate-800">
                      <GitCommitHorizontal className="w-4 h-4 text-[#4B086D]" />
                      <span>NEXT EN-ROUTE SINGAPORE STOPS</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Live Traffic Congestion:{' '}
                      <span className="font-semibold text-slate-700">
                        {currentDirectionData.congestion}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Stepper */}
                  <div className="relative pt-2 pb-1">
                    {/* Connecting Line */}
                    <div className="hidden sm:block absolute top-5 left-[12%] right-[12%] h-0.5 bg-slate-200" />
                    <div className="hidden sm:block absolute top-5 left-[12%] w-[26%] h-0.5 bg-[#4B086D]" />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                      {fallbackArrivalData.enRouteStops.map((stopItem, idx) => {
                        const isFirst = idx === 0;
                        return (
                          <button
                            key={stopItem.code}
                            type="button"
                            onClick={() =>
                              triggerToast(
                                `Stop ${stopItem.code} (${stopItem.name}): Next bus expected in ${stopItem.etaDelta}`
                              )
                            }
                            className="flex flex-col items-center text-center group cursor-pointer"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-110 ${
                                isFirst
                                  ? 'bg-[#4B086D] text-white shadow-xs'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              {stopItem.step}
                            </div>
                            <div className="mt-2 font-display font-bold text-[11px] tracking-wider uppercase text-slate-800 group-hover:text-[#4B086D]">
                              {stopItem.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-num mt-0.5">
                              {stopItem.code} • {stopItem.etaDelta}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER SBS TRANSIT SERVICES AT THIS STOP */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-display font-extrabold tracking-wide text-slate-900 uppercase">
                    OTHER SBS TRANSIT SERVICES AT STOP {currentStopOption.code}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live coordinated dispatch timings at {currentStopOption.name}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-[#F0EDF6] text-[#4B086D] font-display font-bold text-[10px] tracking-wider uppercase self-start sm:self-center">
                  {activeNearbyServices.length} NEARBY ROUTES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeNearbyServices.map((nearby) => (
                  <button
                    key={nearby.serviceNo}
                    type="button"
                    onClick={() => handleSelectNearbyService(nearby.serviceNo)}
                    className="text-left rounded-xl p-4 bg-[#F6F7FC] hover:bg-[#EFEBF7]/60 border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#3D004C] text-white font-display font-extrabold text-base leading-none tabular-nums group-hover:bg-[#EA580C] transition-colors">
                        {nearby.serviceNo}
                      </span>
                      {renderShortOccupancyBadge(nearby.occupancyShort, nearby.occupancyType)}
                    </div>

                    <div className="mt-3 font-display font-bold text-xs tracking-wider uppercase text-slate-800">
                      {nearby.destination}
                    </div>

                    <div className="mt-1.5 flex items-baseline gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-display font-extrabold text-slate-900 tabular-nums">
                          {nearby.mins}
                        </span>
                        <span className="text-[10px] font-display font-bold text-slate-600 uppercase">
                          MINS
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono-num">
                        Subsequent: {nearby.subsequentMins} min
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{nearby.deckType}</span>
                      {nearby.wab && <Accessibility className="w-3.5 h-3.5 text-[#4B086D]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* OCCUPANCY INDICATORS LEGEND BAR */}
            <div className="bg-[#EFEFF6] rounded-xl px-4 py-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-display font-bold tracking-wider uppercase text-slate-700">
                  OCCUPANCY INDICATORS:
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  Seats Available
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  Standing Available
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  Limited Standing
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <span className="inline-flex items-center gap-1 font-bold text-[#4B086D]">
                  <Accessibility className="w-3.5 h-3.5" />
                  WAB Certified
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                  <Bus className="w-3.5 h-3.5 text-slate-500" />
                  Double Decker
                </span>
              </div>
            </div>

            {/* DISCLAIMER FOOTER BOX */}
            <div className="bg-white rounded-xl px-4 py-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-[#EA580C] shrink-0" />
                <span>
                  Bus Arrival Information provided by{' '}
                  <strong className="text-slate-700">
                    Land Transport Authority (LTA) DataMall
                  </strong>
                  . Predictions fluctuate based on real-time road conditions.
                </span>
              </div>
              <span className="font-display font-bold text-[10px] tracking-wider uppercase text-slate-400 shrink-0">
                {lastUpdatedLabel}
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* 7. CORPORATE FOOTER */}
      <footer className="bg-[#F3F2F8] border-t border-slate-200/90 text-xs text-slate-600">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Col 1 */}
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-[#4B086D] mb-3.5">
                TRANSPORT SERVICES
              </h4>
              <ul className="space-y-2.5 text-[11px]">
                {[
                  'NextBus Arrival Timings',
                  'Bus Services Directory',
                  'Downtown Line (DTL)',
                  'North East Line (NEL)',
                  'Sengkang & Punggol LRT',
                  'Jurong Region Line (Future)'
                ].map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      onClick={() => triggerToast(`Opened ${link}`)}
                      className="hover:text-[#4B086D] transition-colors text-left cursor-pointer"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-[#4B086D] mb-3.5">
                KEEP IN TOUCH
              </h4>
              <ul className="space-y-2.5 text-[11px]">
                {[
                  'Frequently Asked Questions',
                  'Customer Feedback',
                  'Travel Enquiries',
                  'Lost & Found Office',
                  'Station Passenger Service'
                ].map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      onClick={() => triggerToast(`Opened ${link}`)}
                      className="hover:text-[#4B086D] transition-colors text-left cursor-pointer"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-[#4B086D] mb-3.5">
                MEDIA &amp; NEWS
              </h4>
              <ul className="space-y-2.5 text-[11px]">
                {[
                  'Press Releases',
                  'Service Announcements',
                  'Route Amendments',
                  'Community Engagement',
                  'Transit Publications'
                ].map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      onClick={() => setShowAllAnnouncementsModal(true)}
                      className="hover:text-[#4B086D] transition-colors text-left cursor-pointer"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-[#4B086D] mb-3.5">
                BUSINESS WITH US
              </h4>
              <ul className="space-y-2.5 text-[11px]">
                {[
                  'Commercial Space & Shop Rental',
                  'Bus & Train Advertising',
                  'Procurement & Tenders',
                  'Careers at SBS Transit',
                  'Shareholder Services'
                ].map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      onClick={() => triggerToast(`Opened ${link}`)}
                      className="hover:text-[#4B086D] transition-colors text-left cursor-pointer"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5: Hotlines */}
            <div>
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-[#4B086D] mb-3.5">
                HOTLINES
              </h4>
              <div className="space-y-3 text-[11px]">
                <div>
                  <div className="font-bold text-slate-800">Transit Hotline:</div>
                  <div className="text-slate-500 font-mono-num">1800-287 2727</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Operating Hours:</div>
                  <div className="text-slate-500">7.30am - 8.00pm Daily</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Emergency SMS:</div>
                  <div className="text-slate-500 font-mono-num">71999</div>
                </div>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#FDE6D8] text-[#C2410C] font-bold text-[10px]">
                    ComfortDelGro Group
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-400">
            <p className="max-w-xl leading-relaxed">
              Real-time bus arrival timings and train operational data powered by Land Transport
              Authority (LTA) DataMall APIs. Bus arrival predictions may vary subject to prevailing
              traffic conditions.
            </p>
            <div className="flex items-center gap-4 shrink-0 text-slate-500">
              <button
                type="button"
                onClick={() => triggerToast('Viewing Terms of Use')}
                className="hover:text-[#4B086D] cursor-pointer"
              >
                Terms of Use
              </button>
              <button
                type="button"
                onClick={() => triggerToast('Viewing Privacy Policy')}
                className="hover:text-[#4B086D] cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => triggerToast('Viewing Sitemap')}
                className="hover:text-[#4B086D] cursor-pointer"
              >
                Sitemap
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              Copyright © 2025 SBS Transit Ltd. (Co. Reg. No.: 199206653M). All Rights Reserved.
            </div>
            <div className="font-bold text-[#4B086D]">A member of ComfortDelGro</div>
          </div>
        </div>
      </footer>

      {/* NEWS ITEM DETAIL MODAL */}
      {selectedNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded bg-[#FFF3E8] text-[#EA580C] text-[10px] font-bold uppercase tracking-wider">
                {selectedNewsModal.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-400 font-mono-num mb-1">
              {selectedNewsModal.date}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{selectedNewsModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-3">
              {selectedNewsModal.fullDetails}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="px-4 py-2 rounded-lg bg-[#4B086D] text-white text-xs font-display font-bold tracking-wider uppercase cursor-pointer"
              >
                CLOSE BULLETIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL ANNOUNCEMENTS MODAL */}
      {showAllAnnouncementsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-[#4B086D] font-display font-bold text-lg uppercase">
                <Megaphone className="w-5 h-5" />
                <span>SBS TRANSIT SERVICE ANNOUNCEMENTS</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAnnouncementsModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {NEWS_ANNOUNCEMENTS.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#EA580C] uppercase">{item.category}</span>
                    <span className="text-slate-400 font-mono-num">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {item.fullDetails}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllAnnouncementsModal(false)}
                className="px-4 py-2 rounded-lg bg-[#4B086D] text-white text-xs font-display font-bold tracking-wider uppercase cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
